'use server';
import { ObjectId } from 'mongodb';
import { connectToMongoDB } from './connectToMongoDB';

let currentDb: any = null;

export async function executeOperation(
  collectionName: string,
  operation: string,
  document: any | null = null
) {
  try {
    // Reuse existing connection if available
    if (!currentDb) {
      currentDb = await connectToMongoDB();
    }

    if (!currentDb) {
      throw new Error('Failed to connect to database');
    }

    // Check if the collection exists
    const collectionExists = await currentDb
      .listCollections({ name: collectionName })
      .toArray();

    // If the collection does not exist, create it
    if (collectionExists.length === 0) {
      await currentDb.createCollection(collectionName);
    }

    if (collectionName === 'users') {
      const existingUser = await currentDb
        .collection(collectionName)
        .findOne({ id: document.id });
      if (existingUser) {
        await currentDb
          .collection(collectionName)
          .updateOne({ id: document.id }, { $set: document });
        return;
      } else {
        await currentDb.collection(collectionName).insertOne(document);
        return;
      }
    }

    // If a document is provided, perform the operation on the collection
    if (document) {
      const brandName = document?.brandName;
      const series = document?.series;
      switch (operation) {
        case 'insertOne':
          await currentDb.collection(collectionName).insertOne(document);
          break;
        case 'insertMany':
          await currentDb.collection(collectionName).insertMany(document);
          break;
        case 'insertStock':
          const existingDocument = await currentDb
            .collection(collectionName)
            .findOne({ brandName: document.brandName });

          if (existingDocument) {
            await currentDb.collection(collectionName).updateOne(
              { brandName: document.brandName },
              {
                $addToSet: {
                  seriesStock: {
                    $each: [
                      {
                        series: document.seriesStock[0].series,
                        productCost: document.seriesStock[0].productCost,
                        inStock: document.seriesStock[0].inStock,
                        createdDate: new Date(),
                      },
                    ],
                  },
                },
              }
            );
          } else {
            await currentDb.collection(collectionName).insertOne(document);
          }
          break;
        case 'updateSeries':
          await currentDb
            .collection(collectionName)
            .updateMany(
              { brandName },
              { $addToSet: { series: { $each: [series] } } }
            );
          break;
        case 'updateStock':
          const inStock = document.inStock;
          const productCost = document.productCost;
          await currentDb.collection(collectionName).updateMany(
            { brandName },
            {
              $addToSet: {
                seriesStock: { $each: [{ series, productCost, inStock }] },
              },
            }
          );
          break;
        case 'updateStockQuantity':
          const quantity = document.quantity;
          const seriesDocument = await currentDb
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
                await currentDb
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
          break;

        case 'updateStockAndSoldCount':
          const updateQuantity = document.quantity;
          const updateSeriesDoc = await currentDb
            .collection(collectionName)
            .findOne({ 'seriesStock.series': series });

          if (updateSeriesDoc) {
            const seriesStock = updateSeriesDoc.seriesStock.find(
              (item: any) => item.series === series
            );
            if (seriesStock) {
              const currentInStock = seriesStock.inStock;
              const currentSoldCount = seriesStock.soldCount || 0;

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

                await currentDb.collection(collectionName).updateOne(
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
          break;

        case 'updateSeriesStock':
          const stock = document.seriesStock[0].inStock;
          const cost = document.seriesStock[0].productCost;
          const ser = document.seriesStock[0].series;
          await currentDb.collection(collectionName).updateMany(
            { brandName, 'seriesStock.series': ser },
            {
              $set: {
                'seriesStock.$.inStock': stock,
                'seriesStock.$.productCost': cost,
                'seriesStock.$.updatedDate': document.updatedDate,
              },
            }
          );
          break;
        case 'updateOne':
          // For categories, replace the entire series array and salesTax field
          if (collectionName === 'categories' && document.data) {
            const id = new ObjectId(document.id);
            await currentDb.collection(collectionName).updateOne(
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
            await currentDb
              .collection(collectionName)
              .updateOne({ _id: id }, update);
          }
          break;
        case 'delete':
          const deleteId = new ObjectId(document.documentId);
          await currentDb
            .collection(collectionName)
            .deleteOne({ _id: deleteId });
          break;
        case 'isExist':
          // Check if a document exists in the collection
          const result = await currentDb
            .collection(collectionName)
            .findOne(document);
          return result !== null;
        case 'upsert':
          if ('_id' in document) {
            console.log('id In', document);

            const docExists = await currentDb
              .collection(collectionName)
              .findOne({ _id: document._id });
            if (docExists) {
              console.log('docExists', document);

              await currentDb
                .collection(collectionName)
                .updateOne({ _id: document._id }, { $set: document });
            } else {
              await currentDb.collection(collectionName).insertOne(document);
            }
          } else {
            await currentDb.collection(collectionName).insertOne(document);
          }

          break;
        case 'isSeriesExistInStock':
          const field = document.field; // Get the dynamic field name
          const value = document.value; // Get the dynamic field value
          const found = await currentDb
            .collection(collectionName)
            .findOne({ seriesStock: { $elemMatch: { [field]: value } } });
          return found !== null;
        case 'findOne':
          const doc = await currentDb
            .collection(collectionName)
            .findOne(document);
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

        // Add other cases for different operations if needed
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    } else {
      // For operations that don't require a document
      switch (operation) {
        case 'findAll':
          const documents = await currentDb
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
        case 'findLast':
          const doc = await currentDb
            .collection(collectionName)
            .findOne({}, { sort: { _id: -1 } });
          if (doc) {
            const serializedDocument: Record<string, any> = {};
            for (const key in doc) {
              if (key === '_id') {
                serializedDocument['id'] = doc[key].toString();
              } else {
                serializedDocument[key] = doc[key];
              }
            }
            return serializedDocument;
          } else {
            return null;
          }
        // Add other cases for different operations if needed
        default:
          throw new Error(`Invalid operation: ${operation}`);
      }
    }
  } catch (error) {
    console.error('❌ Database operation error:', error);
    // Only reset the connection if it's a connection error
    if (error && typeof error === 'object' && 'name' in error) {
      if (
        error.name === 'MongoNetworkError' ||
        error.name === 'MongoServerSelectionError'
      ) {
        currentDb = null;
      }
    }
    throw error;
  }
}
