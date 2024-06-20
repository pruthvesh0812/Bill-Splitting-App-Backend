// import gql from "graphql-tag";
import { ApolloServer } from '@apollo/server';

import resolvers from "./resolvers";
// import { readFileSync } from "fs";
// import path from 'path'
// import { Resolvers } from "./graphql-types";
// import { DataSourceContext } from "./context";
// import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
// import { buildSubgraphSchema } from "@apollo/subgraph";
import { typeDefs } from "./typeDefs";
// const typeDefs = gql(
//     readFileSync(path.join(__dirname,"./schema.gql"),{encoding:"utf-8"})
// )
import { makeExecutableSchema } from '@graphql-tools/schema'

import  { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { serverCleanup } from '../index';
import { httpServer } from '../index';

//to convert your Resolvers object to a GraphQLResolverMap<unknown> object.
//resolversMap that maps each type to its corresponding resolvers.
// but doesnt work so not required

// const generateResolverMap = (resolvers:GraphQLResolverMap<DataSourceContext>)=>{
//     if(resolvers){
//         const resolversMap = {
//             Event: {
//                 date: resolvers.Event?.date!,
//                 eventName: resolvers.Event?.eventName!,
//                 id: resolvers.Event?.id!,
//                 paidByUser: resolvers.Event?.paidByUser!,
//                 status: resolvers.Event?.status!,
//                 totalAmount: resolvers.Event?.totalAmount!,
//               },
//               Group: {
//                 admin: resolvers.Group?.admin!,
//                 id: resolvers.Group?.id!,
//                 users: resolvers.Group?.users!,
//               },
//               Mutation: {
//                 createGroup: resolvers.Mutation?.createGroup!,
//                 createUser: resolvers.Mutation?.createUser!,
//                 joinEvent: resolvers.Mutation?.joinEvent!,
//                 onPayment: resolvers.Mutation?.onPayment!,
//                 postEvent: resolvers.Mutation?.postEvent!,
//               },
//               Query: {
//                 getParticipatedEvents: resolvers.Query?.getParticipatedEvents!,
//                 getUserById: resolvers.Query?.getUserById!,
//                 getUsers: resolvers.Query?.getUsers!,
//               },
//               User: {
//                 balance: resolvers.User?.balance!,
//                 email: resolvers.User?.email!,
//                 events: resolvers.User?.events!,
//                 id: resolvers.User?.id!,
//                 password: resolvers.User?.password!,
//                 username: resolvers.User?.username!,
//               },
//           };
//         return resolversMap
//     }
// }

// const resolversMap = generateResolverMap(resolvers)!
  



/* we need to do this way to get both type safety on 
resolvers and type compatibility between resolvers and server resolver mappers
*/
// otherwise we have to compromise on either one - basically the type safety
/*
 dont use buildSubgraphSchema inside ApolloServer - you wont to be able to 
 use type safety - due to the type compatibility between resolver 
 types generated by codegen and the GraphQLResolverMap
*/


// this works well 
export const schema = makeExecutableSchema({ typeDefs, resolvers })


 export const graphQLServer = new ApolloServer({
    schema:schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer:httpServer }),
  
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],


  });
  



