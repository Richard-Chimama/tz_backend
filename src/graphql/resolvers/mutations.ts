import { Context } from '../../types/context';
import { randomUUID } from 'crypto';

export const mutationResolvers = {
    updateProfile: async (_: any, args: { name?: string, email?: string, phone?: string }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role === 'API_CONSUMER') throw new Error("API Keys cannot update user profiles");
      
      return context.prisma.user.update({
        where: { id: context.user.id },
        data: args,
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
        return context.prisma.priceObservation.create({
            data: {
                ...args,
                observedAt: args.observedAt || new Date(),
            }
        });
    },
    createApprovalRequest: async (_: any, args: any, context: Context) => {
        // TODO: specific logic
        return context.prisma.approvalWorkflow.create({
            data: {
                ...args,
                requesterId: '00000000-0000-0000-0000-000000000000', // Placeholder
            }
        })
    },

    submitScrapedData: async (_: any, { data }: { data: any }, context: Context) => {
      if (!context.user) throw new Error("Not authenticated");
      if (context.user.role !== 'API_CONSUMER' && context.user.role !== 'ADMIN') {
         throw new Error("Unauthorized");
      }

      const { commodityName, cityName, priceValue, priceCurrency, priceUnit, sourceName, sourceUrl, observedAt, brand, country: countryName, imageUrl } = data;

      // 1. Find City (with optional country filter)
      let city;
      if (countryName) {
        const country = await context.prisma.country.findUnique({
             where: { name: countryName }
        });
        // If country provided but not found, we could fail or fallback. Let's try to search city by name if country not found, but log warning?
        // Better: search city by name AND countryId if country found.
        if (country) {
            city = await context.prisma.city.findFirst({
                where: { 
                    name: { equals: cityName, mode: 'insensitive' },
                    countryId: country.id
                }
            });
        } else {
             // Try to find city without country constraint, but maybe it's risky?
             // Or maybe the scraper sends "Tanzania" but we have it stored differently?
             // Fallback to name-only search
             city = await context.prisma.city.findFirst({
                where: { name: { equals: cityName, mode: 'insensitive' } }
             });
        }
      } else {
        city = await context.prisma.city.findFirst({
            where: { name: { equals: cityName, mode: 'insensitive' } }
        });
      }

      if (!city) {
         return { success: false, message: `City not found: ${cityName}` };
      }

      let commodity = await context.prisma.commodity.findFirst({
        where: { name: { equals: commodityName, mode: 'insensitive' } }
      });

      if (!commodity) {
        const alias = await context.prisma.commodityAlias.findFirst({
             where: { name: { equals: commodityName, mode: 'insensitive' } },
             include: { commodity: true }
        });
        if (alias) {
            commodity = (alias as any).commodity;
        }
      }

      if (!commodity) {
          return { success: false, message: `Commodity not found: ${commodityName}` };
      }

      let source = await context.prisma.source.findFirst({
          where: { name: { equals: sourceName, mode: 'insensitive' } }
      });

      if (!source) {
          source = await context.prisma.source.create({
              data: {
                  name: sourceName,
                  type: 'SCRAPER',
                  url: sourceUrl,
                  trustScore: 50,
                  isActive: true
              }
          });
      }

      if (parseFloat(priceValue) < 0) {
           return { success: false, message: `Invalid price: ${priceValue}` };
      }
      
      const entityId = randomUUID();
      
      const changeData = {
          commodityId: commodity.id,
          cityId: city.id,
          sourceId: source.id,
          priceValue,
          priceCurrency,
          priceUnit,
          observedAt: observedAt || new Date().toISOString(),
          isAnomaly: false,
          // Optional fields for updates
          brand,
          imageUrl
      };

      const workflow = await context.prisma.approvalWorkflow.create({
          data: {
              entityType: 'PRICE_OBSERVATION',
              entityId: entityId,
              changeType: 'CREATE',
              changeData: changeData,
              status: 'PENDING',
              requesterId: context.user.id
          }
      });

      return {
          success: true,
          message: 'Data submitted for approval',
          workflowId: workflow.id
      };
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
