export const typeDefs = `#graphql
  scalar DateTime
  scalar JSON
  scalar Decimal

  enum UserRole {
    USER
    ADMIN
    API_CONSUMER
  }

  enum NotificationChannel {
    WHATSAPP
    SMS
    EMAIL
    PUSH
  }

  enum NotificationFrequency {
    DAILY
    WEEKLY
    INSTANT
    NEVER
  }

  enum WorkflowStatus {
    PENDING
    APPROVED
    REJECTED
  }

  enum IntegrationType {
    SCRAPER
    API
    UPLOAD
  }

  type User {
    id: ID!
    name: String
    email: String!
    phone: String
    role: UserRole!
    createdAt: DateTime!
    updatedAt: DateTime!
    preferences: UserPreference
    apiKeys: [ApiKey!]
    smsLogs: [SmsLog!]
    approvalRequests: [ApprovalWorkflow!]
    approvalActions: [ApprovalWorkflow!]
  }

  type UserPreference {
    id: ID!
    userId: String!
    notificationChannel: NotificationChannel!
    notificationFrequency: NotificationFrequency!
    isActive: Boolean!
    languageOverride: String
    savedSearchFilters: JSON
    preferredReportFormat: String
    favoriteCommodities: [String!]
    favoriteCities: [String!]
    accessibilitySettings: JSON
    priceAlertThresholds: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ApiKey {
    id: ID!
    key: String!
    userId: String!
    isActive: Boolean!
    expiresAt: DateTime!
    createdAt: DateTime!
  }

  type SmsLog {
    id: ID!
    userId: String
    messageBody: String!
    sentAt: DateTime!
    status: String!
    providerMessageId: String
  }

  type ApprovalWorkflow {
    id: ID!
    entityType: String!
    entityId: String!
    changeType: String!
    changeData: JSON
    status: WorkflowStatus!
    requesterId: String!
    reviewerId: String
    requestedAt: DateTime!
    reviewedAt: DateTime
    requester: User!
    reviewer: User
  }

  type Country {
    id: ID!
    name: String!
    code: String!
    currency: String!
    timezone: String
    region: String
    language: String
    createdAt: DateTime!
    updatedAt: DateTime!
    cities: [City!]
  }

  type City {
    id: ID!
    name: String!
    region: String
    latitude: Float
    longitude: Float
    timezone: String
    countryId: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    country: Country!
    priceObservations: [PriceObservation!]
    priceAggregates: [PriceAggregate!]
    forecasts: [Forecast!]
  }

  type CommodityCategory {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    commodities: [Commodity!]
  }

  type Brand {
    id: ID!
    name: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    commodities: [Commodity!]
  }

  type Commodity {
    id: ID!
    name: String!
    categoryId: String!
    brandId: String
    unit: String!
    description: String
    imageUrl: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    category: CommodityCategory!
    brand: Brand
    aliases: [CommodityAlias!]
    priceObservations(limit: Int): [PriceObservation!]
    priceAggregates(period: String): [PriceAggregate!]
    forecasts: [Forecast!]
  }

  type CommodityAlias {
    id: ID!
    name: String!
    commodityId: String!
  }

  type Source {
    id: ID!
    name: String!
    type: String!
    url: String
    trustScore: Int!
    scrapingFrequency: String
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    history: [SourceHistory!]
    priceObservations(limit: Int): [PriceObservation!]
  }

  type SourceHistory {
    id: ID!
    sourceId: String!
    name: String!
    url: String
    trustScore: Int!
    scrapingFrequency: String
    validFrom: DateTime!
    validTo: DateTime
  }

  type ExternalIntegration {
    id: ID!
    name: String!
    type: IntegrationType!
    config: JSON!
    isEnabled: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PriceObservation {
    id: ID!
    commodityId: String!
    cityId: String!
    sourceId: String!
    priceValue: Decimal!
    priceCurrency: String!
    priceUnit: String!
    observedAt: DateTime!
    isAnomaly: Boolean!
    qualityScore: Int
    createdAt: DateTime!
    commodity: Commodity!
    city: City!
    source: Source!
  }

  type PriceAggregate {
    id: ID!
    commodityId: String!
    cityId: String!
    date: DateTime!
    period: String!
    avgPrice: Decimal!
    minPrice: Decimal!
    maxPrice: Decimal!
    currency: String!
    sampleSize: Int!
    createdAt: DateTime!
    commodity: Commodity!
    city: City!
  }

  type Forecast {
    id: ID!
    commodityId: String!
    cityId: String!
    dateGenerated: DateTime!
    forecastDate: DateTime!
    predictedPrice: Decimal!
    confidence: Float
    modelUsed: String
    commodity: Commodity!
    city: City!
  }

  type ExchangeRate {
    id: ID!
    fromCurrency: String!
    toCurrency: String!
    rate: Decimal!
    date: DateTime!
    source: String
    createdAt: DateTime!
  }

  type Query {
    me: User
    users: [User!]
    user(id: ID!): User
    
    countries: [Country!]
    country(id: ID!): Country
    
    cities(countryId: ID): [City!]
    city(id: ID!): City
    
    categories: [CommodityCategory!]
    category(id: ID!): CommodityCategory
    
    commodities(categoryId: ID, search: String): [Commodity!]
    commodity(id: ID!): Commodity
    
    sources: [Source!]
    source(id: ID!): Source
    
    latestPrices(cityId: ID, commodityId: ID, limit: Int): [PriceObservation!]
    priceHistory(cityId: ID!, commodityId: ID!, startDate: DateTime!, endDate: DateTime!): [PriceAggregate!]
    
    forecasts(cityId: ID!, commodityId: ID!): [Forecast!]
  }

  type Mutation {
    updateProfile(name: String, email: String, phone: String): User
    updatePreferences(preferences: JSON!): UserPreference
    
    addPriceObservation(
      commodityId: ID!
      cityId: ID!
      sourceId: ID!
      priceValue: Decimal!
      priceCurrency: String!
      priceUnit: String!
      observedAt: DateTime
    ): PriceObservation
    
    createApprovalRequest(
      entityType: String!
      entityId: ID!
      changeType: String!
      changeData: JSON!
    ): ApprovalWorkflow
  }
`;
