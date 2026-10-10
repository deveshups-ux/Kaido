import mongoose from "mongoose";

export function createDbModel(dbName, modelName, schema) {
  const getModel = () => {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      const db = mongoose.connection.useDb(dbName, { useCache: true });
      return db.models[modelName] || db.model(modelName, schema);
    }
    return mongoose.models[modelName] || mongoose.model(modelName, schema);
  };

  return new Proxy(function () {}, {
    construct(target, args) {
      const Model = getModel();
      return new Model(...args);
    },
    get(target, prop) {
      const Model = getModel();
      const val = Model[prop];
      return typeof val === "function" ? val.bind(Model) : val;
    },
  });
}
