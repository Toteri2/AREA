# Review of the benchmark for the backend of the AREA project

This document is the summary of the benchmark that have been performed on three different backend stacks.

Let's start with a little presentation of the three different frameworks that have been benchmarked.

## Presentation of the frameworks

### Django (Python)

Django is a framework made using python for backend project. It has the upside of having a very low learning curve by being in python. Also it's meant to be one of the easiest framework to use for web developement.

### NestJS (NodeJS)

NestJS is a framework made using NodeJS, being a typescript framework it allows for strict typing and very opinionated very inspired by Angular. It's mostly used by firms with big groups of developers.

### Fastify (NodeJS)

Fastify is also a framework made using NodeJS, and being a typescript and javascript framework, it's less strict than NestJS. It's mostly used to make very fast applications, with a lot of data being passed through the backend.

## Pros and Cons

Now let's see the pros and cons of the different frameworks before going into the tests.

### Django

**Pros :**

- Very easy and fast to use
- Loads of documentation and community
- Robust security by default

**Cons :**

- Way slower than NodeJS on heavy loads
- Can be heavy for simple services

### NestJS

**Pros :**

- Clean, scalable and strong architecture
- Strict typing
- Best for big teams and complex projects

**Cons :**

- A bit slower than Fastify
- A higher learning curve

### Fastify

**Pros :**

- One of the fastest frameworks
- Best when fast API's are needed

**Cons :**

- Less strict than NestJS
- Less integrated tools than NestJS or Django

## The Tests

All the frameworks have been benchmarked in the same conditions, using the same Database, and almost the same utils (Jwt for auth etc).

I made a little app with basic authentication and CRUDs endpoints. The script I made to test everything has been made using javascript and autocannon. The script tests the register and login endpoints (they are using bcrypt so it can be a bottleneck of the app) and also the /users endpoint.

The benchmark lasts 10 seconds for each endpoint.

### Django

Let's see what numbers we get from benchmarking the Django server :

1. **/register**
  - 194 requests
  - 492 ms of average latency
  - 19.4 requests per second

2. /login
  - 283 requests
  - 345 ms of average latency
  - 28.3 requests per second

3. /users
  - 2350 requests
  - 41 ms of average latency
  - 235 requests per second

We can see that both of the register and login endpoints are slower than the users endpoint, that can be easily explained by the fact that there is encryption by bcrypt done in these endpoints.

### NestJS

Let's see what numbers we get from benchmarking the NestJS server :

1. **/register**
  - 67306 requests
  - 1.18 ms of average latency
  - 6730 requests per second

2. /login
  - 78872 requests
  - 0.92 ms of average latency
  - 7887 requests per second

3. /users
  - 92643 requests
  - 0.69 ms of average latency
  - 9264 requests per second

This benchmark really shows that NodeJS is way faster than Python for the backend server. Even though we also use bcrypt in the register and login endpoints it's almost 300 times faster.

### Fastify

Let's see what numbers we get from benchmarking the Fastify server :

1. **/register**
  - 80687 requests
  - 0.69 ms of average latency
  - 8068 requests per second

2. /login
  - 79563 requests
  - 0.88 ms of average latency
  - 7956 requests per second

3. /users
  - 92142 requests
  - 0.59 ms of average latency
  - 9214 requests per second

We can see that Fastify really is the fastest framework between those three, it is faster everywhere except for the /users endpoint where it is tied with NestJS.

## Conclusion

These benchmarks show that even tho Django is the easiest framework to use for web backend development, being the slowest out of the three frameworks, it is just not a good option for the AREA where we may have to handle heavy load.

Given these informations, the choice stays between Fastify and NestJS. After creating the apps for benchmarking, I realized that it was easier to create the NestJS one, given the compatibility with TypeORM and the strict typing provided by typescript. Also the strict architecture provided by the framework is really going to make the development of the AREA smoother and easier.
That's why for the AREA, the framework we are going to use is NestJS (NodeJS).
