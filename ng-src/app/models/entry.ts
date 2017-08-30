import { User } from './user';

export class Entry {
  author = '';
  entry_date: Date = new Date();
  words = '';
  created_date?: Date;
  entry_timezone?: string;
  finish_time?: Date;
  milestone_time?: Date;
  milestone_word_count?: number;
  modified_date?: Date;
  start_time?: Date;
  word_count?: number;

  constructor() { }

  public wordCount(): number {
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


