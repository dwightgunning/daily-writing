import { User } from './user';

export class Entry {
  author: string;
  entryDate: Date = new Date();
  words = '';
  createdDate: Date = new Date();
  entryTimezone = 'Etc/UTC';
  finishTime?: Date;
  milestoneTime?: Date;
  milestoneWordCount = 700;
  modifiedDate?: Date;
  startTime?: Date;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

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


