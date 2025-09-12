describe('comment test', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    // given a logged in editor and a page in edit mode
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
      allow_discussion: true,
    });
    cy.visit('/my-page');
    cy.wait('@content');
  });

  it('Adding comment on page', function () {
    cy.get('textarea[id="field-comment"]').clear().type('This is a comment');
    cy.get('button[type="submit"').click();
    cy.get('.comments-section .comments-count').contains('1');
    cy.get('a[aria-label="Delete"]').should('have.text', 'Delete');
    cy.contains('This is a comment');
    cy.get('a[aria-label="Reply"]').click();
    cy.get('[id^="reply-place-"] textarea[id="field-comment"]')
      .clear()
      .type('This is a reply');
    cy.get('[id^="reply-place-"] button[type="submit"').click();
    cy.get('.comments-section .comments-count').contains('2');
    cy.contains('This is a reply');
  });
});
