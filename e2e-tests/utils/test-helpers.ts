import { Page, Locator } from '@playwright/test';

// Authentication helpers
export class AuthHelpers {
  constructor(private page: Page) {}

  async login(email: string = 'test@example.com', password: string = 'testpassword123') {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  async register(userData: {
    email: string;
    displayName: string;
    fullName: string;
    password: string;
  }) {
    await this.page.goto('/register');
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="display-name-input"]', userData.displayName);
    await this.page.fill('[data-testid="full-name-input"]', userData.fullName);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password);
    await this.page.click('[data-testid="register-button"]');
    await this.page.waitForURL('/dashboard');
  }
}

// Navigation helpers
export class NavigationHelpers {
  constructor(private page: Page) {}

  async goToDashboard() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async goToSearch() {
    await this.page.goto('/search');
    await this.page.waitForLoadState('networkidle');
  }

  async goToMyLists() {
    await this.page.goto('/my-lists');
    await this.page.waitForLoadState('networkidle');
  }

  async goToContent(contentId: string) {
    await this.page.goto(`/content/${contentId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async goToProfile() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }
}

// Content interaction helpers
export class ContentHelpers {
  constructor(private page: Page) {}

  async search(query: string) {
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async trackContent(contentId: string, trackingState: 'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'ON_HOLD') {
    const contentCard = this.page.locator(`[data-testid="content-card-${contentId}"]`);
    await contentCard.click();

    await this.page.click(`[data-testid="track-button-${trackingState}"]`);
    await this.page.waitForSelector(`[data-testid="tracking-state-${trackingState}"]`);
  }

  async rateContent(contentId: string, rating: number) {
    await this.page.goto(`/content/${contentId}`);
    await this.page.click(`[data-testid="rating-star-${rating}"]`);
    await this.page.waitForSelector(`[data-testid="current-rating-${rating}"]`);
  }

  async addToList(contentId: string, listId: string) {
    await this.page.goto(`/content/${contentId}`);
    await this.page.click('[data-testid="add-to-list-button"]');
    await this.page.click(`[data-testid="list-option-${listId}"]`);
    await this.page.waitForSelector('[data-testid="added-to-list-success"]');
  }
}

// List management helpers
export class ListHelpers {
  constructor(private page: Page) {}

  async createList(name: string, description?: string, isPublic: boolean = false) {
    await this.page.goto('/my-lists');
    await this.page.click('[data-testid="create-list-button"]');

    await this.page.fill('[data-testid="list-name-input"]', name);
    if (description) {
      await this.page.fill('[data-testid="list-description-input"]', description);
    }
    if (isPublic) {
      await this.page.check('[data-testid="list-public-checkbox"]');
    }

    await this.page.click('[data-testid="save-list-button"]');
    await this.page.waitForSelector(`[data-testid="list-${name}"]`);
  }

  async deleteList(listId: string) {
    await this.page.click(`[data-testid="list-menu-${listId}"]`);
    await this.page.click(`[data-testid="delete-list-${listId}"]`);
    await this.page.click('[data-testid="confirm-delete"]');
    await this.page.waitForSelector(`[data-testid="list-${listId}"]`, { state: 'detached' });
  }

  async shareList(listId: string) {
    await this.page.click(`[data-testid="list-menu-${listId}"]`);
    await this.page.click(`[data-testid="share-list-${listId}"]`);

    const shareUrl = await this.page.inputValue('[data-testid="share-url-input"]');
    return shareUrl;
  }
}

// Wait helpers
export class WaitHelpers {
  constructor(private page: Page) {}

  async waitForContentToLoad() {
    await this.page.waitForSelector('[data-testid="content-grid"]');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForSearchResults() {
    await this.page.waitForSelector('[data-testid="search-results"]');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForListToLoad() {
    await this.page.waitForSelector('[data-testid="list-items"]');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForToast(message?: string) {
    if (message) {
      await this.page.waitForSelector(`[data-testid="toast"]:has-text("${message}")`);
    } else {
      await this.page.waitForSelector('[data-testid="toast"]');
    }
  }

  async waitForModal(modalId: string) {
    await this.page.waitForSelector(`[data-testid="modal-${modalId}"]`);
  }
}

// Assertion helpers
export class AssertionHelpers {
  constructor(private page: Page) {}

  async expectContentInGrid(contentTitle: string) {
    const contentCard = this.page.locator(`[data-testid="content-card"]:has-text("${contentTitle}")`);
    await contentCard.waitFor();
    return contentCard;
  }

  async expectTrackingState(contentId: string, state: string) {
    await this.page.waitForSelector(`[data-testid="content-card-${contentId}"] [data-testid="tracking-state-${state}"]`);
  }

  async expectListContainsContent(listId: string, contentTitle: string) {
    const listContent = this.page.locator(`[data-testid="list-${listId}"] [data-testid="content-item"]:has-text("${contentTitle}")`);
    await listContent.waitFor();
    return listContent;
  }

  async expectToastMessage(message: string) {
    await this.page.waitForSelector(`[data-testid="toast"]:has-text("${message}")`);
  }

  async expectPageTitle(title: string) {
    await this.page.waitForSelector(`h1:has-text("${title}")`);
  }
}

// Performance helpers
export class PerformanceHelpers {
  constructor(private page: Page) {}

  async measurePageLoad(url: string) {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    const endTime = Date.now();

    return endTime - startTime;
  }

  async measureSearchPerformance(query: string) {
    const startTime = Date.now();
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
    await this.page.waitForSelector('[data-testid="search-results"]');
    const endTime = Date.now();

    return endTime - startTime;
  }

  async getNetworkRequests() {
    const requests: string[] = [];

    this.page.on('request', request => {
      requests.push(request.url());
    });

    return requests;
  }
}

// Mobile helpers
export class MobileHelpers {
  constructor(private page: Page) {}

  async swipeLeft(locator: Locator) {
    const box = await locator.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + 10, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  async swipeRight(locator: Locator) {
    const box = await locator.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + 10, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  async pullToRefresh() {
    await this.page.mouse.move(400, 100);
    await this.page.mouse.down();
    await this.page.mouse.move(400, 300);
    await this.page.mouse.up();
  }
}