import { DailyWritingPage } from './app.po';

describe('DailyWritingPage App', () => {
  let page: DailyWritingPage;

  beforeEach(() => {
    page = new DailyWritingPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Daily Writing');
  });
});
