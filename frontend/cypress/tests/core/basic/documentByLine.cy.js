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
  it('DocumentByLine should have admin as the creator', function () {
    cy.navigate('/my-page-1/edit');
    cy.wait('@content');
    cy.getSlateEditorAndType('Colorless green ideas sleep furiously.');
    cy.get('#toolbar-save').click();
    cy.get('#page-document .blocks-group-wrapper div').should(
      'have.class',
      'documentByLine',
    );
    cy.get('.documentByLine').should('contain', 'admin');
  });

  it('Check for published date in the documentByLine', function () {
    cy.navigate('/my-page-1/edit');
    cy.wait('@content');

    cy.get('input#effective-date').click();
    cy.get('input#effective-date').type('{selectall}12/24/2020{esc}');
    cy.get('input#effective-time').type('{downarrow}');
    cy.get('.rc-time-picker-panel-input').type('{selectall}10:00 AM{esc}');

    cy.getSlateEditorAndType('Colorless green ideas sleep furiously.');
    cy.get('#toolbar-save').click();

    cy.get('#toolbar-more').click();
    cy.get('.field-wrapper-state-select .react-select-container ').click();
    cy.get('.react-select__option').contains('Publish').click();
    cy.get('#page-document .blocks-group-wrapper div').should(
      'have.class',
      'documentByLine',
    );
    
    cy.wait('@content');
    cy.get('.documentByLine').should('contain', 'admin');
    cy.get('.documentByLine').should('contain', 'December 24, 2020');
  });
});
