import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { GraphQLScalarType, Kind } from 'graphql';

export const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal custom scalar type',
  serialize(value: any) {
    return value.toString(); // Convert outgoing Decimal to string
  },
  parseValue(value: any) {
    return value; // Convert incoming value (if string/number)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return ast.value;
    }
    return null;
  },
});

export const scalarResolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
  Decimal: DecimalScalar,
};
