import { TEST_VERSION } from '../../src/assets/Enums';
import { TestDataProvider } from '../../src/handlers/expiry/providers/TestDataProvider';

describe('TestDataProvider Util functions', () => {
  describe('filterTestResultsByParam', () => {
    it('filters passed object based on passed param having the passed value', () => {
      const myObject = [
        {
          param1: 'thing',
        },
        {
          param1: 'something else',
        },
      ];
      // @ts-ignore
      const result = TestDataProvider.filterTestResultsByParam(
        myObject as any,
        'param1',
        'thing',
      );
      expect(result).toEqual([{ param1: 'thing' }]);
    });
  });

  describe('filterTestResultsByTestVersion', () => {
    let myObject: any[];
    beforeEach(() => {
      myObject = [
        {
          testVersion: 'current',
          param1: 'thing',
          testHistory: [{ param2: 'archived record', testVersion: 'archived' }],
        },
      ];
    });
    context('when testVersion is CURRENT', () => {
      it('should return test-results without the testHistory array', () => {
        // @ts-ignore
        const result = TestDataProvider.filterTestResultsByTestVersion(
          myObject,
          TEST_VERSION.CURRENT,
        );
        expect(result).toEqual([{ testVersion: 'current', param1: 'thing' }]);
      });
    });

    context('when testVersion is ARCHIVED', () => {
      context(
        'and when the test-result has testVersion: current and testHistory',
        () => {
          it('should return only the testHistory array', () => {
            // @ts-ignore
            const result = TestDataProvider.filterTestResultsByTestVersion(
              myObject,
              TEST_VERSION.ARCHIVED,
            );
            expect(result).toEqual([
              { param2: 'archived record', testVersion: 'archived' },
            ]);
          });
        },
      );

      context(
        'and when the test-result has testVersion: current and no testHistory',
        () => {
          it('should return an empty array', () => {
            delete myObject[0].testHistory;
            // @ts-ignore
            const result = TestDataProvider.filterTestResultsByTestVersion(
              myObject,
              TEST_VERSION.ARCHIVED,
            );
            expect(result).toEqual([]);
          });
        },
      );

      context(
        'and when the test-result has testVersion: archived and no testHistory',
        () => {
          it('should return all the test-results with testVersion: archived', () => {
            myObject[0].testVersion = 'archived';
            delete myObject[0].testHistory;
            // @ts-ignore
            const result = TestDataProvider.filterTestResultsByTestVersion(
              myObject,
              TEST_VERSION.ARCHIVED,
            );
            expect(result).toEqual([
              { testVersion: 'archived', param1: 'thing' },
            ]);
          });
        },
      );

      context(
        'and when the test-result has testVersion: archived and testHistory',
        () => {
          it('should return all the test-results with testVersion: archived', () => {
            myObject[0].testVersion = 'archived';
            // @ts-ignore
            const result = TestDataProvider.filterTestResultsByTestVersion(
              myObject,
              TEST_VERSION.ARCHIVED,
            );
            expect(result).toEqual([
              { testVersion: 'archived', param1: 'thing' },
              { param2: 'archived record', testVersion: 'archived' },
            ]);
          });
        },
      );
    });

    context('when testVersion is ALL', () => {
      it('should return test-results with testHistory array', () => {
        // @ts-ignore
        const result = TestDataProvider.filterTestResultsByTestVersion(
          myObject,
          TEST_VERSION.ALL,
        );
        expect(result).toEqual(myObject);
      });
    });

    context('when testVersion is something else', () => {
      it('should return empty array', () => {
        // @ts-ignore
        const result = TestDataProvider.filterTestResultsByTestVersion(
          myObject,
          'invalid test version',
        );
        expect(result).toEqual([]);
      });
    });
  });
});
