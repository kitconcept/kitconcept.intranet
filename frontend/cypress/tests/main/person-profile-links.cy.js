// Person profiles must stay reachable from listings.
//
// The card itself is a plain div: the link only exists when the Summary
// renders the LinkToItem render prop of the Card primitive. The hover link
// icon is the opposite affordance, shown only when clickable profiles are
// switched off.

context('Person profile links in listings', () => {
  const variations = ['grid', 'summary', 'default'];

  const createPerson = ({ id, firstName, lastName, email }) =>
    cy.createContent({
      contentType: 'Person',
      contentId: id,
      bodyModifier(body) {
        body.first_name = firstName;
        body.last_name = lastName;
        if (email) {
          body.contact_email = email;
        }
        return body;
      },
    });

  const createListingPage = (variation) =>
    cy.createContent({
      contentType: 'Document',
      contentId: `people-${variation}`,
      contentTitle: `People ${variation}`,
      bodyModifier(body) {
        body.blocks['listing'] = {
          '@type': 'listing',
          variation,
          querystring: {
            query: [
              {
                i: 'portal_type',
                o: 'plone.app.querystring.operation.selection.any',
                v: ['Person'],
              },
            ],
          },
        };
        body.blocks_layout.items.push('listing');
        return body;
      },
    });

  beforeEach(() => {
    cy.autologin();
    createPerson({
      id: 'ayla-demir',
      firstName: 'Ayla',
      lastName: 'Demir',
      email: 'ayla.demir@example.com',
    });
    createPerson({ id: 'bob-mayer', firstName: 'Bob', lastName: 'Mayer' });
    variations.forEach((variation) => createListingPage(variation));
  });

  it('links the whole card to the profile when profiles are clickable', () => {
    variations.forEach((variation) => {
      cy.visit(`/people-${variation}`);

      cy.get('.listing-item.person-listing')
        .contains('.card', 'Ayla Demir')
        .as('card');

      cy.get('@card')
        .find('a.card-primary-link')
        .should('have.attr', 'href', '/ayla-demir');

      // the hover icon is the affordance for the other setting
      cy.get('@card').find('.card-link-icon').should('not.exist');

      // the contact address keeps its own link
      cy.get('@card')
        .find('a[href^="mailto:"]')
        .should('have.attr', 'href', 'mailto:ayla.demir@example.com');

      cy.get('@card').find('a.card-primary-link').click();
      cy.url().should('eq', `${Cypress.config().baseUrl}/ayla-demir`);
    });
  });

  it('offers the link icon instead when profiles are not clickable', () => {
    cy.setRegistry('kitconcept.core.settings.clickable_profile_links', false);

    variations.forEach((variation) => {
      cy.visit(`/people-${variation}`);

      cy.get('.listing-item.person-listing')
        .contains('.card', 'Ayla Demir')
        .as('card');

      cy.get('@card').find('a.card-primary-link').should('not.exist');

      cy.get('@card').find('.card-link-icon button').click({ force: true });
      cy.url().should('include', '/ayla-demir');
    });
  });
});
