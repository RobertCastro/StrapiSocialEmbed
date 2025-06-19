import service from './service';
import instagram from './instagram';
import fakeData from './fake-data';
import sync from './sync';

// Tipado explícito para evitar problemas de inferencia
type Services = {
  service: typeof service;
  instagram: typeof instagram;
  'fake-data': typeof fakeData;
  sync: typeof sync;
};

const services: Services = {
  service,
  instagram,
  'fake-data': fakeData,
  sync,
};

export default services;