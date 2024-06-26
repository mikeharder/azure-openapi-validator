import { Spectral } from '@stoplight/spectral-core';
import linterForRule from './utils';

let linter:Spectral;

beforeAll(async () => {
  linter = await linterForRule('PathParameterSchema');
  return linter;
});

test('PathParameterSchema should find errors', () => {
  // Test path parameter in 3 different places:
  // 1. parameter at path level
  // 2. inline parameter at operation level
  // 3. referenced parameter at operation level
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/foo/{p1}': {
        parameters: [
          {
            name: 'p1',
            in: 'path',
            type: 'integer',
          },
        ],
      },
      '/bar/{p2}/baz/{p3}/foo/{p4}': {
        get: {
          parameters: [
            {
              $ref: '#/parameters/Param2',
            },
            {
              name: 'p3',
              in: 'path',
              type: 'string',
              maxLength: 50,
            },
            {
              name: 'p4',
              in: 'path',
              type: 'string',
              maxLength: 2083,
            },
          ],
        },
      },
    },
    parameters: {
      Param2: {
        name: 'p2',
        in: 'path',
        type: 'string',
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(5);
    expect(results[0].path.join('.')).toBe('paths./foo/{p1}.parameters.0');
    expect(results[0].message).toContain('should specify a maximum length');
    expect(results[0].message).toContain('and characters allowed');
    expect(results[1].path.join('.')).toBe('paths./foo/{p1}.parameters.0.type');
    expect(results[1].message).toContain('should be defined as type: string');
    expect(results[2].path.join('.')).toBe('paths./bar/{p2}/baz/{p3}/foo/{p4}.get.parameters.0');
    expect(results[2].message).toContain('should specify a maximum length');
    expect(results[3].path.join('.')).toBe('paths./bar/{p2}/baz/{p3}/foo/{p4}.get.parameters.1');
    expect(results[3].message).toContain('should specify characters allowed');
    expect(results[4].path.join('.')).toBe('paths./bar/{p2}/baz/{p3}/foo/{p4}.get.parameters.2');
    expect(results[4].message).toContain('should be less than');
  });
});

test('PathParameterSchema should find no errors', () => {
  const oasDoc = {
    swagger: '2.0',
    paths: {
      '/foo/{p1}': {
        parameters: [
          {
            name: 'p1',
            in: 'path',
            type: 'string',
            maxLength: 50,
            pattern: '/[a-z]+/',
          },
        ],
      },
      '/bar/{p2}/baz/{p3}': {
        get: {
          parameters: [
            {
              $ref: '#/parameters/Param2',
            },
            {
              name: 'p3',
              in: 'path',
              type: 'string',
              maxLength: 50,
              pattern: '/[a-z]+/',
            },
          ],
        },
      },
    },
    parameters: {
      Param2: {
        name: 'p2',
        in: 'path',
        type: 'string',
        maxLength: 50,
        pattern: '/[a-z]+/',
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(0);
  });
});

test('PathParameterSchema should find oas3 errors', () => {
  const oasDoc = {
    openapi: '3.0',
    paths: {
      '/foo/{p1}': {
        parameters: [
          {
            name: 'p1',
            in: 'path',
            schema: {
              type: 'integer',
            },
          },
        ],
      },
      '/bar/{p2}/baz/{p3}': {
        get: {
          parameters: [
            {
              $ref: '#/components/parameters/Param2',
            },
            {
              name: 'p3',
              in: 'path',
              schema: {
                type: 'string',
                maxLength: 50,
              },
            },
          ],
        },
      },
    },
    components: {
      parameters: {
        Param2: {
          name: 'p2',
          in: 'path',
          schema: {
            type: 'string',
          },
        },
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(4);
    results.sort((a, b) => a.path.join('.').localeCompare(b.path.join('.')));
    expect(results[0].path.join('.')).toBe('paths./bar/{p2}/baz/{p3}.get.parameters.0.schema');
    expect(results[0].message).toContain('should specify a maximum length');
    expect(results[1].path.join('.')).toBe('paths./bar/{p2}/baz/{p3}.get.parameters.1.schema');
    expect(results[1].message).toContain('should specify characters allowed');
    expect(results[2].path.join('.')).toBe('paths./foo/{p1}.parameters.0.schema');
    expect(results[2].message).toContain('should specify a maximum length');
    expect(results[2].message).toContain('and characters allowed');
    expect(results[3].path.join('.')).toBe('paths./foo/{p1}.parameters.0.schema.type');
    expect(results[3].message).toContain('should be defined as type: string');
  });
});

test('PathParameterSchema should find no oas3 errors', () => {
  const oasDoc = {
    openapi: '3.0',
    paths: {
      '/foo/{p1}': {
        parameters: [
          {
            name: 'p1',
            in: 'path',
            schema: {
              type: 'string',
              maxLength: 50,
              pattern: '/[a-z]+/',
            },
          },
        ],
      },
      '/bar/{p2}/baz/{p3}': {
        get: {
          parameters: [
            {
              $ref: '#/components/parameters/Param2',
            },
            {
              name: 'p3',
              in: 'path',
              schema: {
                type: 'string',
                maxLength: 50,
                pattern: '/[a-z]+/',
              },
            },
          ],
        },
      },
    },
    components: {
      parameters: {
        Param2: {
          name: 'p2',
          in: 'path',
          schema: {
            type: 'string',
            maxLength: 50,
            pattern: '/[a-z]+/',
          },
        },
      },
    },
  };
  return linter.run(oasDoc).then((results) => {
    expect(results.length).toBe(0);
  });
});
