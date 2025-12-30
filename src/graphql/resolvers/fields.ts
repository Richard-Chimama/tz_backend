import { Context } from '../../types/context';

export const fieldResolvers = {
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
