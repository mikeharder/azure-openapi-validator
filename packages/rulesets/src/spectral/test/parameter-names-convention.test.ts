import { Spectral } from '@stoplight/spectral-core';
import linterForRule from './utils';

let linter:Spectral;

beforeAll(async () => {
  linter = await linterForRule('ParameterNamesConvention');
  return linter;
});

test('ParameterNamesConvention should find errors', () => {
  // Test parameter names in 3 different places:
  // 1. parameter at path level
  // 2. inline parameter at operation level
  // 3. referenced parameter at operation level
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/test1/{test-id}': {
        parameters: [
          {
            name: 'test-id',
            in: 'path',
            type: 'string',
          },
          {
            name: 'foo_bar',
            in: 'query',
            type: 'string',
          },
          {
            name: 'fooBar',
            in: 'header',
            type: 'string',
            description: 'Camel case header',
          },
          {
            name: '$foo-bar',
            in: 'header',
            type: 'string',
            description: '$ should not be first character of header',
          },
          {
            name: '@foo-bar',
            in: 'header',
            type: 'string',
            description: '@ should not be first character of header',
          },
        ],
        get: {
          parameters: [
            {
              name: 'resource-id',
              in: 'query',
              type: 'string',
            },
            {
              $ref: '#/parameters/SkipParam',
            },
          ],
        },
      },
    },
    parameters: {
      SkipParam: {
        name: '$skip',
        in: 'query',
        type: 'integer',
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(7);
    results.sort((a, b) => a.path.join('.').localeCompare(b.path.join('.')));
    expect(results[0].path.join('.')).toBe('paths./test1/{test-id}.get.parameters.0.name');
    expect(results[1].path.join('.')).toBe('paths./test1/{test-id}.get.parameters.1.name');
    expect(results[2].path.join('.')).toBe('paths./test1/{test-id}.parameters.0.name');
    expect(results[3].path.join('.')).toBe('paths./test1/{test-id}.parameters.1.name');
    expect(results[4].path.join('.')).toBe('paths./test1/{test-id}.parameters.2.name');
    expect(results[5].path.join('.')).toBe('paths./test1/{test-id}.parameters.3.name');
    expect(results[5].message).toContain("should not begin with '$' or '@'");
    expect(results[6].path.join('.')).toBe('paths./test1/{test-id}.parameters.4.name');
    expect(results[6].message).toContain("should not begin with '$' or '@'");
  });
});

test('ParameterNamesConvention should find no errors', () => {
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/test1/{id}': {
        parameters: [
          {
            name: 'id',
            in: 'path',
            type: 'string',
          },
          {
            name: 'fooBar',
            in: 'query',
            type: 'string',
          },
          {
            name: 'foo-bar',
            in: 'header',
            type: 'string',
          },
        ],
        get: {
          parameters: [
            {
              name: 'resourceId',
              in: 'query',
              type: 'string',
            },
            {
              $ref: '#/parameters/SkipParam',
            },
          ],
        },
      },
    },
    parameters: {
      SkipParam: {
        name: 'skip',
        in: 'query',
        type: 'integer',
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(0);
  });
});
