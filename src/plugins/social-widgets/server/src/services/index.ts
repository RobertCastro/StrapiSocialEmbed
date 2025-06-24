import service from './service';
import instagram from './instagram';
import fakeData from './fake-data';
import sync from './sync';
import tiktok from './tiktok';

// Tipado explícito para evitar problemas de inferencia
type Services = {
  service: typeof service;
  instagram: typeof instagram;
  'fake-data': typeof fakeData;
  sync: typeof sync;
  tiktok: typeof tiktok;
};

const services: Services = {
  service,
  instagram,
  'fake-data': fakeData,
  sync,
  tiktok,
};

export default services;