import { User } from './user';

export class Entry {
  author = '';
  entryDate: Date = new Date();
  words = '';
  createdDate?: Date;
  entryTimezone?: string;
  finishTime?: Date;
  milestoneTime?: Date;
  milestoneWordCount?: number;
  modifiedDate?: Date;
  startTime?: Date;

  constructor() { }

  public countWords(): number {
    if (this.words.length) {
      return this.words
        .replace(/(\r\n|\n|\r)/g, ' ')
        .replace(/(\s\s+)/g, ' ')
        .trim()
        .split(' ')
        .length;
    }
    return 0;
  }
}


