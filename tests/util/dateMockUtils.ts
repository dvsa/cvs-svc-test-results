export default class DateMock {
  public static realDate = Date;

  public static setupDateMock = (dateString: string) => {
    const currentDate = new Date(dateString);
    // @ts-ignore
    // tslint:disable:max-classes-per-file
    global.Date = class extends Date {
      constructor(...args: any) {
        if (args.length > 0) {
          // @ts-ignore
          return super(...args);
        }

        return currentDate;
      }
    };
  }

  public static restoreDateMock = () => {
    global.Date = DateMock.realDate;
  }
}

