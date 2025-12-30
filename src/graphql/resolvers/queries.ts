import { Context } from '../../types/context';

export const queryResolvers = {
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
};
