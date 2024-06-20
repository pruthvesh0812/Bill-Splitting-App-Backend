
import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { Users } from "../models/user.models";
import { Resolvers, User } from "./graphql-types";
import { DataSourceContext } from "./context";
import { Groups } from "../models/group.models"

import {PubSub}  from "graphql-subscriptions"

const pubsub = new PubSub();

export const mutationResolvers:Resolvers = {
    Mutation:{
         async createUser(_,{userDetails}){

            // console.log( 
            //     userDetails.username,
            //     userDetails.email,
            //     userDetails.password,
            //     userDetails.events
            // )
            
                const newUser = new Users({username:userDetails.username,email: userDetails.email,password:userDetails.password,balance:0})
                await newUser.save()
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
           
        },
        
        async createGroup(_,{groupDetails}){
            const newGrp = new Groups({admin:groupDetails?.admin,users:groupDetails?.users})
            await newGrp.save()
        
            
           
        
            const grpId = newGrp._id.toString();
            // in this you will get the original details - _id, users,admin, along with their details also
            const groupUsersAdmin:{
                _id: String,
                users:any[],
                admin:any
            }[] = await Groups.aggregate([
                
                {
                    $lookup:{
                        from:"users",
                        localField:"users",
                        foreignField:"_id",
                        as:"userDetails"
                    }
                },
                
                {
                    $unwind:{
                        path:"$userDetails",                       
                    }
                },
                {
                    $lookup:{
                        from:"users",
                        localField:"admin",
                        foreignField:"_id",
                        as:"adminDetails"
                    }
                },
                {
                    $unwind:{
                        path:"$adminDetails"
                    }
                }
                
                ,
                {
                    $group: {
                      _id: "$_id",
                      users:{  $push:"$userDetails"},
                      admin: { $first: "$adminDetails" }
                    }
                }
            ])
        
            console.log(groupUsersAdmin[0].users,"group users admin")// NOTE: this is an array always
            console.log(groupUsersAdmin[0].users[0],"group user")// NOTE: this is an array always
            
            const users = groupUsersAdmin[0].users.map((user)=>{
                return {...user,id:user._id.toString()}
            })
        
            const admin = {...groupUsersAdmin[0].admin,id:groupUsersAdmin[0].admin._id.toString()}
            // publish to pubsub
            pubsub.publish('GROUP_CREATED', {
                GroupCreated:{id:grpId,users,admin}// Group type // NOTE TO HAVE OBJECT ACCORDING TO SCHEMA TYPE
            })

            return {id:grpId,users,admin}
        }
        
    }
}
