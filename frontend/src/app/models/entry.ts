import { User } from './user';

import * as moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min';

export const DEFAULT_MILESTONE_WORD_COUNT = 700;

export class Entry {
  author: string;
  createdDate: Date = new Date();
  entryDate: Date = new Date();
  entryTimezone = 'Etc/UTC';
  finishTime?: Date;
  milestoneTime?: Date;
  milestoneWordCount = DEFAULT_MILESTONE_WORD_COUNT;
  modifiedDate?: Date;
  startTime?: Date;
  private _words = '';  // tslint:variable-name

  constructor(obj?: any) {
    if (obj) {
      const {words, ...otherValues} = obj;
      this._words = words ? words : '';
      Object.assign(this, otherValues);
    }
  }

  toJSON() {
    return {words: this._words, ...this};
  }

  public get words(): string {
      return this._words;
  }

  public set words(words: string) {
    this._words = words;
    this.finishTime = new Date();
    if (!this.milestoneTime && this.countWords() >= this.milestoneWordCount) {
      this.milestoneTime = new Date();
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

  public lastSavedLocalString(): string {
    return this.formatLocalTime(this.modifiedDate);
  }

  public milestoneTimeLocalString(): string {
    return this.formatLocalTime(this.milestoneTime);
  }

  private formatLocalTime(timeToFormat) {
    if (timeToFormat) {
      return moment(timeToFormat).tz(this.entryTimezone).format('HH:mm:ss');
    } else {
      return null;
    }
  }
}
