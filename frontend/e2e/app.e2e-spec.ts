import { DailyEntryPage } from './app.po';

describe('DailyEntryPage App', () => {
  let page: DailyEntryPage;

  beforeEach(() => {
    page = new DailyEntryPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Daily Writing');
  });
});
