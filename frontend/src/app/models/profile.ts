export class Profile {
  email?: string;
  firstName?: string;
  lastName?: string;
  timezone?: string;
  targetMilestoneWordCount?: number;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
