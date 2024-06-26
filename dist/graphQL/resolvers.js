"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_models_1 = require("../models/user.models");
const group_models_1 = require("../models/group.models");
// import { subscriptionResolvers } from "./subscriptionsResolver";
const queryResolvers_1 = require("./queryResolvers");
const graphql_yoga_1 = require("graphql-yoga");
// import {PubSub, withFilter}  from "graphql-subscriptions"
const resolvers = {
    Query: queryResolvers_1.queryResolvers.Query,
    Mutation: {
        createUser(_, { userDetails }) {
            return __awaiter(this, void 0, void 0, function* () {
                // console.log( 
                //     userDetails.username,
                //     userDetails.email,
                //     userDetails.password,
                //     userDetails.events
                // )
                const newUser = new user_models_1.Users({ username: userDetails.username, email: userDetails.email, password: userDetails.password, balance: 0 });
                yield newUser.save();
                return {
                    id: newUser._id.toString(),
                    username: newUser.username,
                    email: newUser.email,
                    password: newUser.password,
                    balance: newUser.balance,
                    events: []
                };
                // console.log({...newUser,id:newUser._id.toString(),events:[]})
                // return {...newUser, id:newUser._id.toString(), events:[]}
            });
        },
        createGroup(_, { groupDetails }, { dataSources }) {
            return __awaiter(this, void 0, void 0, function* () {
                const newGrp = new group_models_1.Groups({ admin: groupDetails === null || groupDetails === void 0 ? void 0 : groupDetails.admin, users: groupDetails === null || groupDetails === void 0 ? void 0 : groupDetails.users });
                yield newGrp.save();
                const grpId = newGrp._id.toString();
                // in this you will get the original details - _id, users,admin, along with their details also
                const groupUsersAdmin = yield group_models_1.Groups.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "users",
                            foreignField: "_id",
                            as: "userDetails"
                        }
                    },
                    {
                        $unwind: {
                            path: "$userDetails",
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "admin",
                            foreignField: "_id",
                            as: "adminDetails"
                        }
                    },
                    {
                        $unwind: {
                            path: "$adminDetails"
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            users: { $push: "$userDetails" },
                            admin: { $first: "$adminDetails" }
                        }
                    }
                ]);
                console.log(groupUsersAdmin[0].users, "group users admin"); // NOTE: this is an array always
                console.log(groupUsersAdmin[0].users[0], "group user"); // NOTE: this is an array always
                const users = groupUsersAdmin[0].users.map((user) => {
                    return Object.assign(Object.assign({}, user), { id: user._id.toString() });
                });
                const admin = Object.assign(Object.assign({}, groupUsersAdmin[0].admin), { id: groupUsersAdmin[0].admin._id.toString() });
                // publish to pubsub
                dataSources.pubsub.publish('GROUP_CREATED', {
                    GroupCreated: { id: grpId, users, admin } // Group type // NOTE TO HAVE OBJECT ACCORDING TO SCHEMA TYPE
                });
                return { id: grpId, users, admin };
            });
        }
    },
    Subscription: {
        GroupCreated: {
            subscribe: (_, args, { dataSources }) => (0, graphql_yoga_1.pipe)(dataSources.pubsub.subscribe('GROUP_CREATED'), 
            // only sending ws message to those users who are invited by admin
            (0, graphql_yoga_1.filter)((payload) => payload.GroupCreated.users.some((user) => user.id == args.id))
            // client checking his id is present in those invited
            )
            // above approach is not efficient when there are many users and only one server
            // for any group created .. the server will be doing calculations for each user in FCFS manner
        }
    }
};
exports.default = resolvers;
