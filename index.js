const { ApolloServer, PubSub, gql } = require("apollo-server");

const createIdGenerator = ({ initial }) => () => initial++;
const nextId = createIdGenerator({ initial: 5 });

const typeDefs = gql`
  type Query {
    users: [User]!
  }

  type User {
    id: Int!
    name: String!
    email: String!
    age: Int
  }

  type Mutation {
    addUser(name: String!, email: String!, age: Int): User!
  }

  type Subscription {
    userAdded: User!
  }
`;

const USER_ADDED = "USER_ADDED";
const pubsub = new PubSub();
const db = {
  users: [
    { id: 1, name: "Diego", email: "diego.borges@powerhrg.com", age: 33 },
    { id: 2, name: "Ben", email: "ben@powerhrg.com" },
    { id: 3, name: "Stephen", email: "stephen@powerhrg.com" },
    { id: 4, name: "Anthony", email: "tony@powerhrg.com" }
  ]
};

const resolvers = {
  Query: {
    users: () => {
      console.log(">>>> resolving users", db.users);
      return db.users;
    }
  },
  Mutation: {
    addUser: (parent, { name, email, age }, context) => {
      const user = {
        id: nextId(),
        name,
        email,
        age
      };

      db.users.push(user);
      pubsub.publish(USER_ADDED, { userAdded: user });
      return user;
    }
  },
  Subscription: {
    userAdded: {
      subscribe: () => pubsub.asyncIterator([USER_ADDED])
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: (connectionParams, webSocket) => {
      // returns a fake/empty context
      // ideally there would be some auth token verification here.
      console.log(">>> subscription created for", connectionParams);
      return {};
    }
  }
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});
