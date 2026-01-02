import { Context } from '../../types/context';
import { isEmail, isPhoneNumber, sanitizeString, sanitizeEmail } from '../../lib/validation';
import { MarketDataService } from '../../services/marketDataService';

export const mutationResolvers = {
    updateProfile: async (_: any, args: { name?: string, email?: string, phone?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role === 'API_CONSUMER') throw new Error("API Keys cannot update user profiles");
      
      const data: any = {};
      if (args.name) {
          data.name = sanitizeString(args.name);
      }
      if (args.email) {
          if (!isEmail(args.email)) throw new Error("Invalid email format");
          data.email = sanitizeEmail(args.email);
      }
      if (args.phone) {
          if (!isPhoneNumber(args.phone)) throw new Error("Invalid phone number format");
          data.phone = args.phone; // Assuming we store it as is, or we could strip format
      }

      return context.prisma.user.update({
        where: { id: context.user.id },
        data,
      });
    },
    updatePreferences: async (_: any, { preferences }: { preferences: any }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role === 'API_CONSUMER') throw new Error("API Keys cannot update user preferences");

      return context.prisma.userPreference.upsert({
        where: { userId: context.user.id },
        update: preferences,
        create: {
          userId: context.user.id,
          ...preferences
        }
      });
    },
    addPriceObservation: async (_: any, args: any, context: Context) => {
        if (!context.user) throw new Error("Not authenticated");
        return context.prisma.priceObservation.create({
            data: {
                ...args,
                observedAt: args.observedAt || new Date(),
            }
        });
    },
    createApprovalRequest: async (_: any, args: { entityType: string, entityId: string, changeType: string, changeData: any }, context: Context) => {
        if (!context.user) throw new Error("Not authenticated");

        // Validate Entity Type
        const allowedEntityTypes = ['COMMODITY', 'PRICE_OBSERVATION', 'CITY', 'SOURCE', 'BRAND']; 
        if (!allowedEntityTypes.includes(args.entityType)) {
             throw new Error(`Invalid entity type: ${args.entityType}`);
        }

        // Validate Change Type
        const allowedChangeTypes = ['CREATE', 'UPDATE', 'DELETE'];
        if (!allowedChangeTypes.includes(args.changeType)) {
            throw new Error(`Invalid change type: ${args.changeType}`);
        }

        return context.prisma.approvalWorkflow.create({
            data: {
                entityType: args.entityType,
                entityId: args.entityId,
                changeType: args.changeType,
                changeData: args.changeData,
                status: 'PENDING',
                requesterId: context.user.id,
            }
        })
    },

    submitScrapedData: async (_: any, { data }: { data: any }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== 'API_CONSUMER' && context.user.role !== 'ADMIN') {
         throw new Error("Unauthorized");
      }

      return MarketDataService.submitScrapedData(data, context);
    },

    approveWorkflow: async (_: any, { id, overrides }: { id: string, overrides?: any }, context: Context) => {
        if (!context.user) throw new Error("Not authenticated");
        if (context.user.role !== 'ADMIN') {
            throw new Error("Unauthorized: Only admins can approve");
        }
    
        const workflow = await context.prisma.approvalWorkflow.findUnique({
            where: { id }
        });
    
        if (!workflow) throw new Error("Workflow not found");
        if (workflow.status !== 'PENDING') throw new Error("Workflow is not pending");
    
        if (workflow.entityType === 'PRICE_OBSERVATION' && workflow.changeType === 'CREATE') {
            const originalData = workflow.changeData as any;
            const data = { ...originalData, ...overrides };
            
            // 1. Handle Brand (Optional update)
            if (data.brand) {
                // If the commodity doesn't have a brand, or we want to associate it
                const commodity = await context.prisma.commodity.findUnique({ where: { id: data.commodityId } });
                if (commodity && !commodity.brandId) {
                    // Check if brand exists
                    let brand = await context.prisma.brand.findUnique({ where: { name: data.brand } });
                    if (!brand) {
                        brand = await context.prisma.brand.create({
                            data: { name: data.brand }
                        });
                        // Log brand creation
                        await context.prisma.auditLog.create({
                            data: {
                                userId: context.user.id,
                                action: 'CREATE_BRAND',
                                entity: 'BRAND',
                                entityId: brand.id,
                                details: { name: data.brand }
                            }
                        });
                    }
                    
                    // Update commodity
                    await context.prisma.commodity.update({
                        where: { id: commodity.id },
                        data: { brandId: brand.id }
                    });

                    // Log commodity update
                    await context.prisma.auditLog.create({
                        data: {
                            userId: context.user.id,
                            action: 'UPDATE_COMMODITY_BRAND',
                            entity: 'COMMODITY',
                            entityId: commodity.id,
                            details: { brandId: brand.id, brandName: data.brand }
                        }
                    });
                }
            }

            // 2. Handle Image URL (Optional update)
            if (data.imageUrl) {
                 const commodity = await context.prisma.commodity.findUnique({ where: { id: data.commodityId } });
                 if (commodity && !commodity.imageUrl) {
                     await context.prisma.commodity.update({
                         where: { id: commodity.id },
                         data: { imageUrl: data.imageUrl }
                     });
                     
                     // Log update
                     await context.prisma.auditLog.create({
                         data: {
                             userId: context.user.id,
                             action: 'UPDATE_COMMODITY_IMAGE',
                             entity: 'COMMODITY',
                             entityId: commodity.id,
                             details: { imageUrl: data.imageUrl }
                         }
                     });
                 }
            }

            // 3. Create the observation
            await context.prisma.priceObservation.create({
                data: {
                    id: workflow.entityId, 
                    commodityId: data.commodityId,
                    cityId: data.cityId,
                    sourceId: data.sourceId,
                    priceValue: data.priceValue,
                    priceCurrency: data.priceCurrency,
                    priceUnit: data.priceUnit,
                    observedAt: data.observedAt,
                    isAnomaly: data.isAnomaly
                }
            });
    
            return context.prisma.approvalWorkflow.update({
                where: { id },
                data: {
                    status: 'APPROVED',
                    reviewerId: context.user.id,
                    reviewedAt: new Date()
                }
            });
        }
    
        throw new Error("Unsupported workflow type");
    },
    
    rejectWorkflow: async (_: any, { id }: { id: string }, context: Context) => {
        if (!context.user) throw new Error("Not authenticated");
        if (context.user.role !== 'ADMIN') {
            throw new Error("Unauthorized");
        }
    
        const workflow = await context.prisma.approvalWorkflow.findUnique({
            where: { id }
        });
    
        if (!workflow) throw new Error("Workflow not found");
        if (workflow.status !== 'PENDING') throw new Error("Workflow is not pending");
    
        return context.prisma.approvalWorkflow.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reviewerId: context.user.id,
                reviewedAt: new Date()
            }
        });
    }
};
