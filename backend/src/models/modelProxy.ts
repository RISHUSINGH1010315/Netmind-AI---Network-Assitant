import mongoose from 'mongoose';
import { getMockModel } from './dbFallback';

export function wrapModelWithProxy(modelName: string, realModel: any): any {
  return new Proxy(realModel, {
    // Intercept static calls: Model.find, Model.findOne, etc.
    get(target, prop) {
      if (mongoose.connection.readyState === 1) {
        return Reflect.get(target, prop);
      } else {
        const mockModel = getMockModel(modelName);
        return Reflect.get(mockModel, prop);
      }
    },
    // Intercept constructor calls: new Model(data)
    construct(target, argumentsList) {
      if (mongoose.connection.readyState === 1) {
        return Reflect.construct(target, argumentsList);
      } else {
        const mockModel = getMockModel(modelName) as any;
        return Reflect.construct(mockModel, argumentsList);
      }
    }
  });
}
