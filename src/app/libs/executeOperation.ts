'use server';
import { ObjectId } from 'mongodb';
import { connectToMongoDB } from './connectToMongoDB';

export async function executeOperation(
  collectionName: string,
  operation: string,
  document: any | null = null
) {
  try {
    // Always get a fresh connection instead of reusing a global variable
    const db = await connectToMongoDB();

    if (!db) {
      throw new Error('Failed to connect to database');
    }

    // Check if the collection exists
    const collectionExists = await db
      .listCollections({ name: collectionName })
      .toArray();

    // If the collection does not exist, create it
    if (collectionExists.length === 0) {
      await db.createCollection(collectionName);
    }

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

    // If a document is provided, perform the operation on the collection
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
                        soldCount: 0, // Initialize soldCount as number
                        createdDate: new Date(),
                      },
                    ],
                  },
                },
              }
            );
          } else {
            // Ensure all numeric fields are numbers before inserting
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
                return await db
                  .collection(collectionName)
                  .updateOne(
                    { 'seriesStock.series': series },
                    { $set: { 'seriesStock.$.inStock': newInStock } }
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

              console.log(
                `📦 Stock update for ${series}: currentInStock=${currentInStock}, currentSoldCount=${currentSoldCount}, updateQuantity=${updateQuantity}`
              );

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

                console.log(
                  `📦 Stock update result for ${series}: inStock ${currentInStock} → ${newInStock}, soldCount ${currentSoldCount} → ${newSoldCount}`
                );

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
          const restoreSeriesDoc = await db
            .collection(collectionName)
            .findOne({ 'seriesStock.series': series });

          if (restoreSeriesDoc) {
            const seriesStock = restoreSeriesDoc.seriesStock.find(
              (item: any) => item.series === series
            );
            if (seriesStock) {
              const currentInStock = parseInt(seriesStock.inStock) || 0;
              const currentSoldCount = parseInt(seriesStock.soldCount) || 0;

              console.log(
                `🔄 Stock restore for ${series}: currentInStock=${currentInStock}, currentSoldCount=${currentSoldCount}, restoreQuantity=${restoreQuantity}`
              );

              // Restore stock quantities (increase inStock, decrease soldCount)
              const newInStock = currentInStock + restoreQuantity;
              const newSoldCount = Math.max(
                0,
                currentSoldCount - restoreQuantity
              ); // Don't go below 0

              console.log(
                `🔄 Stock restore result for ${series}: inStock ${currentInStock} → ${newInStock}, soldCount ${currentSoldCount} → ${newSoldCount}`
              );

              return await db.collection(collectionName).updateOne(
                { 'seriesStock.series': series },
                {
                  $set: {
                    'seriesStock.$.inStock': newInStock,
                    'seriesStock.$.soldCount': newSoldCount,
                  },
                }
              );
            } else {
              throw new Error(`Series '${series}' not found in stock.`);
            }
          } else {
            throw new Error(`Series '${series}' not found in stock.`);
          }

        case 'updateSeriesStock':
          const stock = parseInt(document.seriesStock[0].inStock) || 0;
          const cost = parseFloat(document.seriesStock[0].productCost) || 0;
          const soldCount = parseInt(document.seriesStock[0].soldCount) || 0;
          const ser = document.seriesStock[0].series;
          console.log('Updating series stock:', {
            brandName,
            ser,
            stock,
            cost,
            soldCount,
          });
          const updateResult = await db.collection(collectionName).updateMany(
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
          console.log('Update series stock result:', updateResult);
          return updateResult;

        case 'deleteSeriesStock':
          // First check if the series exists in the stock
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
          // For categories, replace the entire series array and salesTax field
          if (collectionName === 'categories' && document.data) {
            const id = new ObjectId(document.id);
            return await db.collection(collectionName).updateOne(
              { _id: id },
              {
                $set: {
                  ...document.data,
                  addedDate: new Date(),
                },
              }
            );
          } else {
            const id = new ObjectId(document.documentId);
            const update = {
              $set: {
                ...document,
                addedDate: new Date(),
              },
            };
            return await db
              .collection(collectionName)
              .updateOne({ _id: id }, update);
          }

        case 'delete':
          const deleteId = new ObjectId(document.documentId);
          return await db
            .collection(collectionName)
            .deleteOne({ _id: deleteId });

        case 'deleteOne':
          return await db.collection(collectionName).deleteOne(document);

        case 'isExist':
          // Check if a document exists in the collection
          const existResult = await db
            .collection(collectionName)
            .findOne(document);
          return existResult !== null;

        case 'upsert':
          if ('_id' in document) {
            console.log('id In', document);

            const docExists = await db
              .collection(collectionName)
              .findOne({ _id: document._id });
            if (docExists) {
              console.log('docExists', document);
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
          const field = document.field; // Get the dynamic field name
          const value = document.value; // Get the dynamic field value
          const found = await db
            .collection(collectionName)
            .findOne({ seriesStock: { $elemMatch: { [field]: value } } });
          return found !== null;

        case 'findOne':
          const doc = await db.collection(collectionName).findOne(document);
          if (doc) {
            const serializedDocument: Record<string, any> = {};
            for (const key in doc) {
              if (key === '_id') {
                serializedDocument['documentId'] = doc[key].toString();
              } else {
                serializedDocument[key] = doc[key];
              }
            }
            return serializedDocument;
          } else {
            return null;
          }

        // Add the missing 'find' operation that was causing the error
        case 'find':
          const documents = await db
            .collection(collectionName)
            .find(document || {})
            .toArray();
          return documents.map((doc: any) => {
            const serializedDocument: Record<string, any> = {};
            for (const key in doc) {
              if (key === '_id') {
                serializedDocument['id'] = doc[key].toString();
              } else {
                serializedDocument[key] = doc[key];
              }
            }
            return serializedDocument;
          });

        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    } else {
      // For operations that don't require a document
      switch (operation) {
        case 'findAll':
          const documents = await db
            .collection(collectionName)
            .find()
            .toArray();
          return documents.map((doc: any) => {
            const serializedDocument: Record<string, any> = {};
            for (const key in doc) {
              if (key === '_id') {
                serializedDocument['id'] = doc[key].toString();
              } else {
                serializedDocument[key] = doc[key];
              }
            }
            return serializedDocument;
          });

        case 'find':
          const findDocs = await db
            .collection(collectionName)
            .find({})
            .toArray();
          return findDocs.map((doc: any) => {
            const serializedDocument: Record<string, any> = {};
            for (const key in doc) {
              if (key === '_id') {
                serializedDocument['id'] = doc[key].toString();
              } else {
                serializedDocument[key] = doc[key];
              }
            }
            return serializedDocument;
          });

        case 'findLast':
          const lastDoc = await db
            .collection(collectionName)
            .findOne({}, { sort: { _id: -1 } });
          if (lastDoc) {
            const serializedDocument: Record<string, any> = {};
            for (const key in lastDoc) {
              if (key === '_id') {
                serializedDocument['id'] = lastDoc[key].toString();
              } else {
                serializedDocument[key] = lastDoc[key];
              }
            }
            return serializedDocument;
          } else {
            return null;
          }

        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    }
  } catch (error) {
    console.error('❌ Database operation error:', error);
    // During build time, return empty array instead of throwing error
    if (process.env.NODE_ENV === 'production' && operation === 'findAll') {
      console.warn('⚠️ Build-time database error, returning empty array');
      return [];
    }
    throw error;
  }
}
