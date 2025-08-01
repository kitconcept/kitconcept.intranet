describe('DocumentByLine Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page-1',
      contentTitle: 'My Page-1',
      allow_discussion: true,
    });

    cy.visit('/my-page-1');
  });
  it('Add creators, should show below the Title', function () {
    cy.navigate('/my-page-1/edit');
    cy.wait('@content');
    cy.getSlateEditorAndType('Colorless green ideas sleep furiously.');
    cy.get('#toolbar-save').click();
    cy.get('#page-document .blocks-group-wrapper div').should(
      'have.class',
      'documentByLine',
    );
  });
});
