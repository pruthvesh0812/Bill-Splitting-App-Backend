"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `
  input EventInput {
  eventName: String!
  date: String!
  totalAmount: Float!
  status: EventStatus!
}

type User {
  id: ID!
  username: String!
  email: String!
  password: String!
  balance: Float
  events: [Event!]!
}

type Group {
  id: ID!
  users: [User!]!
  admin: User
}

type Event {
  id: ID!
  eventName: String!
  date: String!
  totalAmount: Float!
  paidByUser: [User]!
  status: EventStatus!
}

enum EventStatus {
  OPEN
  CLOSE
}

type Query {
  getUsers: [User]
  getUserById(username:String!): User!
  getParticipatedEvents(id: ID!): [Event!]
}

input createUserInput {
  username: String!
  email: String!
  password: String!
  events: EventInput
}

input createGrpInput {
  users: [ID!]!
  admin: ID!
}

input UserInput {
  id: ID!
  username: String!
  email: String!
  password: String!
  balance: Float
}

input paymentInput {
  user: UserInput!
  amount: Float!
  event: EventInput
}

type Mutation {
  createUser(userDetails: createUserInput!): User!
  createGroup(groupDetails: createGrpInput): Group!
  postEvent(event: EventInput): Event!
  joinEvent(user: UserInput!): User
  onPayment(payment: paymentInput): User
}

type Subscription{
  GroupCreated(id:ID!):Group
}

`;
