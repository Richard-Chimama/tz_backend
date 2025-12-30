import { Context } from '../types/context';
import { randomUUID } from 'crypto';

interface ScrapedData {
    commodityName: string;
    cityName: string;
    priceValue: string;
    priceCurrency: string;
    priceUnit: string;
    sourceName: string;
    sourceUrl: string;
    observedAt?: string;
    brand?: string;
    country?: string;
    imageUrl?: string;
}

export class MarketDataService {
    /**
     * Submits scraped data for approval, with deduplication checks.
     */
    static async submitScrapedData(data: ScrapedData, context: Context) {
        const { commodityName, cityName, priceValue, priceCurrency, priceUnit, sourceName, sourceUrl, observedAt, brand, country: countryName, imageUrl } = data;

        // 1. Resolve Entities
        const city = await this.resolveCity(cityName, countryName, context);
        if (!city) return { success: false, message: `City not found: ${cityName}` };

        const commodity = await this.resolveCommodity(commodityName, context);
        if (!commodity) return { success: false, message: `Commodity not found: ${commodityName}` };

        const source = await this.resolveSource(sourceName, sourceUrl, context);

        // 2. Validate Price
        if (parseFloat(priceValue) < 0) {
            return { success: false, message: `Invalid price: ${priceValue}` };
        }

        const observationDate = observedAt ? new Date(observedAt) : new Date();

        // 3. Deduplication Checks
        
        // Check 3.1: Existing Observation
        // We consider it a duplicate if same commodity, city, source, and price is observed on the same day.
        const startOfDay = new Date(observationDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(observationDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingObservation = await context.prisma.priceObservation.findFirst({
            where: {
                commodityId: commodity.id,
                cityId: city.id,
                sourceId: source.id,
                observedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (existingObservation) {
            // If price is exactly the same, it's definitely a duplicate.
            if (existingObservation.priceValue.toString() === priceValue.toString()) {
                return { success: true, message: 'Duplicate observation skipped', skipped: true };
            }
            // If price differs, we proceed (could be an update or correction)
        }

        // Check 3.2: Existing Pending Workflow
        // We fetch pending workflows for PRICE_OBSERVATION created recently to avoid full table scan.
        const pendingWorkflows = await context.prisma.approvalWorkflow.findMany({
            where: {
                entityType: 'PRICE_OBSERVATION',
                changeType: 'CREATE',
                status: 'PENDING',
                requestedAt: {
                    gte: startOfDay
                }
            }
        });

        const isDuplicateWorkflow = pendingWorkflows.some(wf => {
            const changeData = wf.changeData as any;
            return changeData.commodityId === commodity.id &&
                   changeData.cityId === city.id &&
                   changeData.sourceId === source.id &&
                   new Date(changeData.observedAt).toDateString() === observationDate.toDateString() &&
                   changeData.priceValue.toString() === priceValue.toString();
        });

        if (isDuplicateWorkflow) {
             return { success: true, message: 'Duplicate pending workflow skipped', skipped: true };
        }

        // 4. Create Workflow
        const entityId = randomUUID();
        
        const changeData = {
            commodityId: commodity.id,
            cityId: city.id,
            sourceId: source.id,
            priceValue,
            priceCurrency,
            priceUnit,
            observedAt: observationDate.toISOString(),
            isAnomaly: false,
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
                requesterId: context.user!.id
            }
        });

        return {
            success: true,
            message: 'Data submitted for approval',
            workflowId: workflow.id
        };
    }

    private static async resolveCity(name: string, countryName: string | undefined, context: Context) {
        if (countryName) {
            const country = await context.prisma.country.findUnique({ where: { name: countryName } });
            if (country) {
                return context.prisma.city.findFirst({
                    where: {
                        name: { equals: name, mode: 'insensitive' },
                        countryId: country.id
                    }
                });
            }
        }
        return context.prisma.city.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });
    }

    private static async resolveCommodity(name: string, context: Context) {
        let commodity = await context.prisma.commodity.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });

        if (!commodity) {
            const alias = await context.prisma.commodityAlias.findFirst({
                where: { name: { equals: name, mode: 'insensitive' } },
                include: { commodity: true }
            });
            if (alias) {
                commodity = (alias as any).commodity;
            }
        }
        return commodity;
    }

    private static async resolveSource(name: string, url: string, context: Context) {
        let source = await context.prisma.source.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });

        if (!source) {
            source = await context.prisma.source.create({
                data: {
                    name: name,
                    type: 'SCRAPER',
                    url: url,
                    trustScore: 50,
                    isActive: true
                }
            });
        }
        return source;
    }
}
