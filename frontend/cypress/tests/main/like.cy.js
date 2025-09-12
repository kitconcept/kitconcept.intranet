describe('Like', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    // given a logged in editor and a page in edit mode
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
    });
    cy.visit('/my-page');
    cy.wait('@content');
  });

  it('Test like functionality', () => {
    cy.get(".likes-section button[aria-label='liked']").click();
    cy.get('.likes-section .likes-count span').contains('1');
    cy.get(".likes-section button[aria-label='liked']").click();
    cy.get('.likes-section .likes-count span').contains('0');
  });
});
