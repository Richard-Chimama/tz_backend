import { queryResolvers } from './queries';
import { mutationResolvers } from './mutations';
import { fieldResolvers } from './fields';
import { scalarResolvers } from './scalars';

export const resolvers = {
  ...scalarResolvers,
  Query: queryResolvers,
  Mutation: mutationResolvers,
  ...fieldResolvers,
};
