/* eslint-disable class-methods-use-this */
import 'reflect-metadata';

function wrapNothrowFn(fn: (...args: any[]) => any) {
  return function guardFn(...args: any[]) {
    try {
      fn(...args);
    } catch {
      console.info('got you!');
    }
  };
}

const key = Symbol('nothrow_key');

function nothrow(): PropertyDecorator {
  return function nothrowDecorator(target: any) {
    Reflect.defineMetadata(key, true, target.descriptor.value); // tag = true
  };
}

class Demo {
  @nothrow()
  throwSth(message: string) {
    throw new Error(message);
  }

  static instance() {
    const instance = Reflect.construct(Demo, []);

    Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
      .forEach((prop) => {
        const tag = Reflect.getMetadata(key, instance[prop]);

        if (tag) {
          Reflect.set(instance, prop, wrapNothrowFn(instance[prop].bind(instance)));
        }
      });

    return instance;
  }
}

const demo = Demo.instance();

demo.throwSth('throwing!');
