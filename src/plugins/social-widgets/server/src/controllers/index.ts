import controller from './controller';
import auth from './auth';
import sync from './sync';

// Tipado explícito para evitar problemas de inferencia
type Controllers = {
  controller: typeof controller;
  auth: typeof auth;
  sync: typeof sync;
};

const controllers: Controllers = {
  controller,
  auth,
  sync,
};

export default controllers;