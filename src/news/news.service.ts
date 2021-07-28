import { Injectable } from '@nestjs/common';
import { ChangeLog } from './news';

@Injectable()
export class NewsService {
  getApptray(): ChangeLog[] {
    const changeLog: ChangeLog[] = [
      {
        title: '7/17/2021, V 1.2',
        changes: [
          'The search bar is auto selected now.',
          'Better app icons now.',
          'Removed to feature to have multiple images for apps.',
        ],
      },
      {
        title: '7/1/2021, V 1.0.1',
        changes: [
          'Changed New tab opening when clicking the logo to go to your apptray home.',
        ],
      },
      {
        title: '6/30/2021, V 1.0',
        changes: ['First Release'],
      },
      {
        title: '5/18/2021, V 0.1',
        changes: ['Beta Release'],
      },
    ];

    return changeLog;
  }

  getMain(): ChangeLog[] {
    const changeLog: ChangeLog[] = [
      {
        title: 'Apptray beta is closed',
        changes: [
          'Apptray has reached closed beta and is a completely usable app.',
          'You should still expect bugs.',
        ],
      },
      {
        title: 'Apptray beta is released',
        changes: ['The app store and edit mode are still in development.'],
      },
      {
        title: 'Apptray has started development',
        changes: [
          'Apptray will be a app where you can access all of our apps and add you own apps with a url.',
          'We have started development and beta versions will be available by 2021 Q2.',
          'We are planning to release it in Q3.',
        ],
      },
    ];

    return changeLog;
  }

  getConvertor(): ChangeLog[] {
    const changeLog: ChangeLog[] = [
      {
        title: '4/23/2021, V 1.2.2',
        changes: ['Added a search bar', 'Added a tutorial for new users'],
      },
      {
        title: '3/24/2021, V 1.2.1',
        changes: ['Quick fix for the history page bug'],
      },
      {
        title: '3/12/2021, V 1.2',
        changes: [
          'Rewrote the conversion system',
          'Redid the UI',
          'Performance improvements by over 30%',
        ],
      },
      {
        title: '2/2/2021, V 1.1',
        changes: ['Fixed all conversion issues', 'Fixed some minor bugs'],
      },
      {
        title: '1/16/2021, V 1.0',
        changes: ['Release'],
      },
    ];

    return changeLog;
  }

  getWebsite(): ChangeLog[] {
    const changeLog: ChangeLog[] = [
      {
        title: '7/8/2021, V 1.2',
        changes: ['UI update for some pages'],
      },
      {
        title: '7/1/2021, V 1.1.1',
        changes: [
          'Changed New tab opening when on any product to use the same tab.',
        ],
      },
      {
        title: '4/18/2021, V 1.1',
        changes: [
          'Minor improvements',
          'Fixed the log-in/sign-in bug',
          'Added a news page',
        ],
      },
      {
        title: '1/29/2021, V 1.0',
        changes: ['Release'],
      },
    ];

    return changeLog;
  }
}
