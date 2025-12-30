import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { GraphQLScalarType, Kind } from 'graphql';
import { Context } from '../types/context';

const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal custom scalar type',
  serialize(value: any) {
    return value.toString(); // Convert outgoing Decimal to string
  },
  parseValue(value: any) {
    return value; // Convert incoming value (if string/number)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return ast.value;
    }
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  Decimal: DecimalScalar,

  Query: {
    me: async (_: any, __: any, context: Context) => {
      if (!context.user) return null;
      return context.prisma.user.findUnique({ where: { id: context.user.id } });
    },
    users: async (_: any, __: any, context: Context) => {
      return context.prisma.user.findMany();
    },
    user: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.user.findUnique({ where: { id } });
    },

    countries: async (_: any, __: any, context: Context) => {
      return context.prisma.country.findMany();
    },
    country: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.country.findUnique({ where: { id } });
    },

    cities: async (_: any, { countryId }: { countryId?: string }, context: Context) => {
      return context.prisma.city.findMany({
        where: countryId ? { countryId } : undefined,
      });
    },
    city: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.city.findUnique({ where: { id } });
    },

    categories: async (_: any, __: any, context: Context) => {
      return context.prisma.commodityCategory.findMany();
    },
    category: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.commodityCategory.findUnique({ where: { id } });
    },

    commodities: async (_: any, { categoryId, search }: { categoryId?: string, search?: string }, context: Context) => {
      return context.prisma.commodity.findMany({
        where: {
          categoryId: categoryId || undefined,
          name: search ? { contains: search, mode: 'insensitive' } : undefined,
        },
      });
    },
    commodity: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.commodity.findUnique({ where: { id } });
    },

    sources: async (_: any, __: any, context: Context) => {
      return context.prisma.source.findMany();
    },
    source: async (_: any, { id }: { id: string }, context: Context) => {
      return context.prisma.source.findUnique({ where: { id } });
    },

    latestPrices: async (_: any, { cityId, commodityId, limit }: { cityId?: string, commodityId?: string, limit?: number }, context: Context) => {
      return context.prisma.priceObservation.findMany({
        where: {
          cityId: cityId || undefined,
          commodityId: commodityId || undefined,
        },
        orderBy: { observedAt: 'desc' },
        take: limit || 50,
      });
    },
    
    priceHistory: async (_: any, { cityId, commodityId, startDate, endDate }: { cityId: string, commodityId: string, startDate: Date, endDate: Date }, context: Context) => {
      return context.prisma.priceAggregate.findMany({
        where: {
          cityId,
          commodityId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });
    },

    forecasts: async (_: any, { cityId, commodityId }: { cityId: string, commodityId: string }, context: Context) => {
      return context.prisma.forecast.findMany({
        where: {
          cityId,
          commodityId,
          forecastDate: {
            gte: new Date(), // Future forecasts only
          },
        },
        orderBy: { forecastDate: 'asc' },
      });
    },
  },

  Mutation: {
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
    }
  },

  // Field Resolvers
  User: {
    preferences: (parent: any, _: any, context: Context) => context.prisma.userPreference.findUnique({ where: { userId: parent.id } }),
    apiKeys: (parent: any, _: any, context: Context) => context.prisma.apiKey.findMany({ where: { userId: parent.id } }),
    smsLogs: (parent: any, _: any, context: Context) => context.prisma.smsLog.findMany({ where: { userId: parent.id } }),
  },
  Country: {
    cities: (parent: any, _: any, context: Context) => context.prisma.city.findMany({ where: { countryId: parent.id } }),
  },
  City: {
    country: (parent: any, _: any, context: Context) => context.prisma.country.findUnique({ where: { id: parent.countryId } }),
    priceObservations: (parent: any, _: any, context: Context) => context.prisma.priceObservation.findMany({ where: { cityId: parent.id }, take: 20, orderBy: { observedAt: 'desc' } }),
    priceAggregates: (parent: any, _: any, context: Context) => context.prisma.priceAggregate.findMany({ where: { cityId: parent.id }, take: 20 }),
  },
  CommodityCategory: {
    commodities: (parent: any, _: any, context: Context) => context.prisma.commodity.findMany({ where: { categoryId: parent.id } }),
  },
  Commodity: {
    category: (parent: any, _: any, context: Context) => context.prisma.commodityCategory.findUnique({ where: { id: parent.categoryId } }),
    brand: (parent: any, _: any, context: Context) => parent.brandId ? context.prisma.brand.findUnique({ where: { id: parent.brandId } }) : null,
    aliases: (parent: any, _: any, context: Context) => context.prisma.commodityAlias.findMany({ where: { commodityId: parent.id } }),
    priceObservations: (parent: any, { limit }: { limit?: number }, context: Context) => context.prisma.priceObservation.findMany({ where: { commodityId: parent.id }, take: limit || 20, orderBy: { observedAt: 'desc' } }),
  },
  Source: {
    history: (parent: any, _: any, context: Context) => context.prisma.sourceHistory.findMany({ where: { sourceId: parent.id } }),
  },
  PriceObservation: {
    commodity: (parent: any, _: any, context: Context) => context.prisma.commodity.findUnique({ where: { id: parent.commodityId } }),
    city: (parent: any, _: any, context: Context) => context.prisma.city.findUnique({ where: { id: parent.cityId } }),
    source: (parent: any, _: any, context: Context) => context.prisma.source.findUnique({ where: { id: parent.sourceId } }),
  },
  PriceAggregate: {
    commodity: (parent: any, _: any, context: Context) => context.prisma.commodity.findUnique({ where: { id: parent.commodityId } }),
    city: (parent: any, _: any, context: Context) => context.prisma.city.findUnique({ where: { id: parent.cityId } }),
  },
  Forecast: {
    commodity: (parent: any, _: any, context: Context) => context.prisma.commodity.findUnique({ where: { id: parent.commodityId } }),
    city: (parent: any, _: any, context: Context) => context.prisma.city.findUnique({ where: { id: parent.cityId } }),
  }
};
