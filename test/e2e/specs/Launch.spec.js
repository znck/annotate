import utils from '../utils';

import { name } from '../../../config';

describe('Launch', () => {
  beforeEach(utils.beforeEach);
  afterEach(utils.afterEach);

  it('shows the proper application title', function launchApplication() {
    return this.app.client.getTitle()
      .then((title) => {
        expect(title).to.equal(name);
      });
  });
});
