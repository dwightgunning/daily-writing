export class ApiDataPage {
  count: number;
  next?: string;
  previous?: string;
  results: any[];

  constructor(page: any) {
    this.count = page.count;
    this.next = page.next;
    this.previous = page.previous;
    this.results = page.results;
  }
}
