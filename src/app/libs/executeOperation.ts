'use server';
import { ObjectId } from 'mongodb';
import { connectToMongoDB } from './connectToMongoDB';

// ✅ Reusable serializer — removes duplicate code
function serializeDoc(doc: any): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in doc) {
    result[key === '_id' ? 'id' : key] =
      key === '_id' ? doc[key].toString() : doc[key];
  }
  return result;
}

export async function executeOperation(
  collectionName: string,
  operation: string,
  document: any | null = null
) {
  try {
    const db = await connectToMongoDB();

    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // ❌ REMOVED: listCollections check — MongoDB auto-creates collections on insert
    // This was running on every single request and costing ~30-50ms

    // Handle users collection specially
    if (collectionName === 'users' && document) {
      const existingUser = await db
        .collection(collectionName)
        .findOne({ id: document.id });

      if (existingUser) {
        await db
          .collection(collectionName)
          .updateOne({ id: document.id }, { $set: document });
        return;
      } else {
        await db.collection(collectionName).insertOne(document);
        return;
      }
    }

    if (document) {
      const brandName = document?.brandName;
      const series = document?.series;

      switch (operation) {
        case 'insertOne':
          return await db.collection(collectionName).insertOne(document);

        case 'insertMany':
          return await db.collection(collectionName).insertMany(document);

        case 'insertStock':
          const existingDocument = await db
            .collection(collectionName)
            .findOne({ brandName: document.brandName });

          if (existingDocument) {
            return await db.collection(collectionName).updateOne(
              { brandName: document.brandName },
              {
                $addToSet: {
                  seriesStock: {
                    $each: [
                      {
                        series: document.seriesStock[0].series,
                        productCost:
                          parseFloat(document.seriesStock[0].productCost) || 0,
                        inStock: parseInt(document.seriesStock[0].inStock) || 0,
                        soldCount: 0,
                        createdDate: new Date(),
                      },
                    ],
                  },
                },
              }
            );
          } else {
            const stockDocument = {
              ...document,
              seriesStock: document.seriesStock.map((stock: any) => ({
                ...stock,
                productCost: parseFloat(stock.productCost) || 0,
                inStock: parseInt(stock.inStock) || 0,
                soldCount: parseInt(stock.soldCount) || 0,
              })),
            };
            return await db.collection(collectionName).insertOne(stockDocument);
          }

        case 'updateSeries':
          return await db
            .collection(collectionName)
            .updateMany(
              { brandName },
              { $addToSet: { series: { $each: [series] } } }
            );

        case 'updateStock':
          const inStock = document.inStock;
          const productCost = document.productCost;
          return await db.collection(collectionName).updateMany(
            { brandName },
            {
              $addToSet: {
                seriesStock: { $each: [{ series, productCost, inStock }] },
              },
            }
          );

        case 'updateStockQuantity':
          const quantity = document.quantity;
          const seriesDocument = await db
            .collection(collectionName)
            .findOne({ 'seriesStock.series': series });

          if (seriesDocument) {
            const seriesStock = seriesDocument.seriesStock.find(
              (item: any) => item.series === series
            );
            if (seriesStock) {
              const currentInStock = seriesStock.inStock;
              if (currentInStock === 0) {
                throw new Error(
                  `Stock for series '${series}' is already depleted.`
                );
              } else if (quantity > currentInStock) {
                throw new Error(
                  `Insufficient stock for series '${series}'. Available stock: ${currentInStock}`
                );
              } else {
                const newInStock = currentInStock - quantity;
                return await db.collection(collectionName).updateOne(
                  { 'seriesStock.series': series },
                  {
                    $set: { 'seriesStock.$.inStock': newInStock },
                    $inc: { 'seriesStock.$.soldCount': quantity },
                  }
                );
              }
            } else {
              throw new Error(`Series '${series}' not found in stock.`);
            }
          } else {
            throw new Error(`Series '${series}' not found.`);
          }

        case 'updateStockAndSoldCount':
          const updateQuantity = parseInt(document.quantity) || 0;
          const updateSeriesDoc = await db
            .collection(collectionName)
            .findOne({ 'seriesStock.series': series });

          if (updateSeriesDoc) {
            const seriesStock = updateSeriesDoc.seriesStock.find(
              (item: any) => item.series === series
            );
            if (seriesStock) {
              const currentInStock = parseInt(seriesStock.inStock) || 0;
              const currentSoldCount = parseInt(seriesStock.soldCount) || 0;

              if (currentInStock === 0) {
                throw new Error(
                  `Stock for series '${series}' is already depleted.`
                );
              } else if (updateQuantity > currentInStock) {
                throw new Error(
                  `Insufficient stock for series '${series}'. Available stock: ${currentInStock}`
                );
              } else {
                const newInStock = currentInStock - updateQuantity;
                const newSoldCount = currentSoldCount + updateQuantity;

                return await db.collection(collectionName).updateOne(
                  { 'seriesStock.series': series },
                  {
                    $set: {
                      'seriesStock.$.inStock': newInStock,
                      'seriesStock.$.soldCount': newSoldCount,
                    },
                  }
                );
              }
            } else {
              throw new Error(`Series '${series}' not found in stock.`);
            }
          } else {
            throw new Error(`Series '${series}' not found.`);
          }

        case 'restoreStockFromInvoice':
          const restoreQuantity = parseInt(document.quantity) || 0;
          const restoreSeries = document.series;

          const restoreSeriesDoc = await db
            .collection(collectionName)
            .findOne({ 'seriesStock.series': restoreSeries });

          if (restoreSeriesDoc) {
            const seriesStock = restoreSeriesDoc.seriesStock.find(
              (item: any) => item.series === restoreSeries
            );
            if (seriesStock) {
              const currentInStock = parseInt(seriesStock.inStock) || 0;
              const currentSoldCount = parseInt(seriesStock.soldCount) || 0;
              const newInStock = currentInStock + restoreQuantity;
              const newSoldCount = Math.max(
                0,
                currentSoldCount - restoreQuantity
              );

              return await db.collection(collectionName).updateOne(
                { 'seriesStock.series': restoreSeries },
                {
                  $set: {
                    'seriesStock.$.inStock': newInStock,
                    'seriesStock.$.soldCount': newSoldCount,
                  },
                }
              );
            } else {
              throw new Error(`Series '${restoreSeries}' not found in stock.`);
            }
          } else {
            throw new Error(`Series '${restoreSeries}' not found in stock.`);
          }

        case 'addStockAndDecrementSoldCount':
          const addQuantity = parseInt(document.quantity) || 0;
          const addSeries = document.series;

          const addSeriesDoc = await db
            .collection(collectionName)
            .findOne({ 'seriesStock.series': addSeries });

          if (addSeriesDoc) {
            const seriesStock = addSeriesDoc.seriesStock.find(
              (item: any) => item.series === addSeries
            );
            if (seriesStock) {
              const currentInStock = parseInt(seriesStock.inStock) || 0;
              const currentSoldCount = parseInt(seriesStock.soldCount) || 0;
              const newInStock = currentInStock + addQuantity;
              const newSoldCount = Math.max(0, currentSoldCount - addQuantity);

              return await db.collection(collectionName).updateOne(
                { 'seriesStock.series': addSeries },
                {
                  $set: {
                    'seriesStock.$.inStock': newInStock,
                    'seriesStock.$.soldCount': newSoldCount,
                    'seriesStock.$.updatedDate': new Date().toISOString(),
                  },
                }
              );
            } else {
              throw new Error(`Series '${addSeries}' not found in stock.`);
            }
          } else {
            throw new Error(`Series '${addSeries}' not found in stock.`);
          }

        case 'updateSeriesStock':
          const stock = parseInt(document.seriesStock[0].inStock) || 0;
          const cost = parseFloat(document.seriesStock[0].productCost) || 0;
          const soldCount = parseInt(document.seriesStock[0].soldCount) || 0;
          const ser = document.seriesStock[0].series;
          return await db.collection(collectionName).updateMany(
            { brandName, 'seriesStock.series': ser },
            {
              $set: {
                'seriesStock.$.inStock': stock,
                'seriesStock.$.productCost': cost,
                'seriesStock.$.soldCount': soldCount,
                'seriesStock.$.updatedDate':
                  document.seriesStock[0].updatedDate,
              },
            }
          );

        case 'deleteSeriesStock':
          const existingStock = await db.collection(collectionName).findOne({
            brandName,
            'seriesStock.series': series,
          });

          if (!existingStock) {
            throw new Error(
              `Series '${series}' not found in stock for brand '${brandName}'`
            );
          }

          return await db.collection(collectionName).updateOne({ brandName }, {
            $pull: { seriesStock: { series: series } },
          } as any);

        case 'updateOne':
          if (collectionName === 'categories' && document.data) {
            const id = new ObjectId(document.id);
            return await db
              .collection(collectionName)
              .updateOne(
                { _id: id },
                { $set: { ...document.data, addedDate: new Date() } }
              );
          } else {
            const rawId = document.documentId || document._id || document.id;
            if (!rawId)
              throw new Error('Missing document identifier for updateOne');
            const id = new ObjectId(rawId);
            const { documentId, _id, id: _plainId, ...updateFields } = document;
            return await db
              .collection(collectionName)
              .updateOne(
                { _id: id },
                { $set: { ...updateFields, addedDate: new Date() } }
              );
          }

        case 'delete':
          const deleteId = new ObjectId(document.documentId);
          return await db
            .collection(collectionName)
            .deleteOne({ _id: deleteId });

        case 'deleteOne':
          return await db.collection(collectionName).deleteOne(document);

        case 'isExist':
          const existResult = await db
            .collection(collectionName)
            .findOne(document);
          return existResult !== null;

        case 'upsert':
          if ('_id' in document) {
            const docExists = await db
              .collection(collectionName)
              .findOne({ _id: document._id });
            if (docExists) {
              return await db
                .collection(collectionName)
                .updateOne({ _id: document._id }, { $set: document });
            } else {
              return await db.collection(collectionName).insertOne(document);
            }
          } else {
            return await db.collection(collectionName).insertOne(document);
          }

        case 'isSeriesExistInStock':
          const field = document.field;
          const value = document.value;
          const found = await db
            .collection(collectionName)
            .findOne({ 'seriesStock.series': value });
          return found !== null;

        case 'findOne':
          const doc = await db.collection(collectionName).findOne(document);
          return doc ? serializeDoc(doc) : null;

        case 'find':
          const docs = await db
            .collection(collectionName)
            .find(document || {})
            .toArray();
          return docs.map(serializeDoc);

        // ✅ NEW: server-side pagination — MongoDB does sort/skip/limit
        case 'findPaginated': {
          const filter = document?.filter || {};
          const sort = document?.sort || { _id: -1 };
          const skip = document?.skip || 0;
          const limit = document?.limit;

          const query = db
            .collection(collectionName)
            .find(filter)
            .sort(sort)
            .skip(skip);

          if (limit) {
            query.limit(limit);
          }

          const [results, total] = await Promise.all([
            query.toArray(),
            db.collection(collectionName).countDocuments(filter),
          ]);

          return {
            docs: results.map(serializeDoc),
            total,
          };
        }

        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    } else {
      switch (operation) {
        case 'findAll':
          const documents = await db
            .collection(collectionName)
            .find()
            .toArray();
          return documents.map(serializeDoc);

        case 'find':
          const findDocs = await db
            .collection(collectionName)
            .find({})
            .toArray();
          return findDocs.map(serializeDoc);

        case 'findLast':
          const lastDoc = await db
            .collection(collectionName)
            .findOne({}, { sort: { _id: -1 } });
          return lastDoc ? serializeDoc(lastDoc) : null;

        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    }
  } catch (error) {
    console.error('❌ Database operation error:', error);
    if (process.env.NODE_ENV === 'production' && operation === 'findAll') {
      console.warn('⚠️ Build-time database error, returning empty array');
      return [];
    }
    throw error;
  }
}
