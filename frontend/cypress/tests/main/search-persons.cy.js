// Tests for the Persons search tab and its condition facets.
//
// Functionally, these tests belong to kitconcept.solr. However,
// kitconcept.solr does not contain a Person content type and does not
// configure a search tab with condition facets by default, so it cannot
// self-contain these tests. kitconcept.intranet provides the Person type
// and configures the Persons search tab with condition facets
// (see profiles/solr/registry/kitconcept.solr.interfaces.IKitconceptSolrSettings.xml),
// so the tests live here for now.
//
// The tests follow the style of the cypress tests in kitconcept.solr.

context('Search Acceptance Tests (Persons tab with condition facets)', () => {
  // UIDs of the referenced Location / Organisational Unit objects,
  // filled in beforeEach and used by the bodyModifier callbacks
  // (which are evaluated at command execution time).
  const refs = {};

  const createPerson = ({
    id,
    firstName,
    lastName,
    building,
    room,
    responsibilities,
    location,
    organisationalUnit,
  }) =>
    cy.createContent({
      contentType: 'Person',
      contentId: id,
      bodyModifier(body) {
        body.first_name = firstName;
        body.last_name = lastName;
        if (building) {
          body.contact_building = building;
        }
        if (room) {
          body.contact_room = room;
        }
        if (responsibilities) {
          body.responsibilities = responsibilities;
        }
        if (location) {
          body.location_reference = [refs[location]];
        }
        if (organisationalUnit) {
          body.organisational_unit_reference = [refs[organisationalUnit]];
        }
        return body;
      },
    });

  beforeEach(() => {
    // The solr connection parameters are provided by the COLLECTIVE_SOLR_*
    // environment variables (docker compose setup) or by the registry
    // defaults (local setup, solr listening on localhost:8983).
    // Only the activation is needed here.
    cy.setRegistry('collective.solr.active', true);
    cy.reindexSolr();

    // referenced content
    cy.createContent({
      contentType: 'Location',
      contentId: 'bonn',
      contentTitle: 'Bonn',
    }).then((response) => (refs.bonn = response.body.UID));
    cy.createContent({
      contentType: 'Location',
      contentId: 'berlin',
      contentTitle: 'Berlin',
    }).then((response) => (refs.berlin = response.body.UID));
    cy.createContent({
      contentType: 'Organisational Unit',
      contentId: 'robotics-institute',
      contentTitle: 'Robotics Institute',
    }).then((response) => (refs.robotics = response.body.UID));
    cy.createContent({
      contentType: 'Organisational Unit',
      contentId: 'administration-office',
      contentTitle: 'Administration Office',
    }).then((response) => (refs.administration = response.body.UID));

    // persons
    createPerson({
      id: 'ayla-demir',
      firstName: 'Ayla',
      lastName: 'Demir',
      building: 'Building A',
      room: '101',
      responsibilities: ['Project Management'],
      location: 'bonn',
      organisationalUnit: 'robotics',
    });
    createPerson({
      id: 'bob-miller',
      firstName: 'Bob',
      lastName: 'Miller',
      building: 'Building A',
      room: '102',
      responsibilities: ['Onboarding'],
      location: 'berlin',
      organisationalUnit: 'administration',
    });
    createPerson({
      id: 'carla-schmidt',
      firstName: 'Carla',
      lastName: 'Schmidt',
      building: 'Building B',
      room: '101',
      responsibilities: ['Project Management', 'Onboarding'],
      location: 'bonn',
      organisationalUnit: 'robotics',
    });

    cy.autologin();
  });
  afterEach(() => {
    cy.clearSolr();
  });

  it('Persons tab shows person results', function () {
    cy.visit('/search');

    // The Persons tab is shown with the number of persons found
    cy.get('.searchTab').should('have.length', 6);
    cy.get('.searchTab').eq(5).contains('Persons');
    cy.get('.searchTab').eq(5).find('.searchCounter').should('have.text', '3');

    // Select the Persons tab
    cy.get('.searchTab').eq(5).click();
    cy.get('.searchTab').eq(5).should('have.class', 'active');

    // Persons are rendered with the person result view
    cy.get('.tileItem.personResultItem').should('have.length', 3);
    cy.get('.tileItem .tileHeadline').contains('Ayla Demir');
    cy.get('.tileItem .tileHeadline').contains('Bob Miller');
    cy.get('.tileItem .tileHeadline').contains('Carla Schmidt');

    // Persons can be found by their name
    cy.visit('/search?SearchableText=Demir&group_select=5');
    cy.get('.total-bar .results').contains('1');
    cy.get('.tileItem .tileHeadline').contains('Ayla Demir');
  });

  it('Persons tab shows condition facets', function () {
    cy.visit('/search?group_select=5');

    // All configured facet fields are shown, in the configured order
    cy.get('.searchConditionsField .searchConditionsFieldHeader').should(
      ($div) => {
        expect($div).to.have.length(5);
        expect($div.get(0).innerText).to.contain('Building');
        expect($div.get(1).innerText).to.contain('Room');
        expect($div.get(2).innerText).to.contain('Responsibilities');
        expect($div.get(3).innerText).to.contain('Location');
        expect($div.get(4).innerText).to.contain('Organisational Unit');
      },
    );

    // Values are sorted by count, then alphabetically, with counters
    cy.contains('.searchConditionsField', 'Building').within(() => {
      cy.get('.searchConditionsValue').should('have.length', 2);
      cy.get('.searchConditionsValue').eq(0).contains('Building A');
      cy.get('.searchConditionsValue')
        .eq(0)
        .find('.searchConditionsCounter')
        .should('have.text', '2');
      cy.get('.searchConditionsValue').eq(1).contains('Building B');
      cy.get('.searchConditionsValue')
        .eq(1)
        .find('.searchConditionsCounter')
        .should('have.text', '1');
    });

    // Vocabulary based facets show the title of the referenced object,
    // not its UID
    cy.contains('.searchConditionsField', 'Location').within(() => {
      cy.get('.searchConditionsValue').should('have.length', 2);
      cy.get('.searchConditionsValue').eq(0).contains('Bonn');
      cy.get('.searchConditionsValue')
        .eq(0)
        .find('.searchConditionsCounter')
        .should('have.text', '2');
      cy.get('.searchConditionsValue').eq(1).contains('Berlin');
    });
    cy.contains('.searchConditionsField', 'Organisational Unit').within(() => {
      cy.get('.searchConditionsValue').eq(0).contains('Robotics Institute');
      cy.get('.searchConditionsValue').eq(1).contains('Administration Office');
    });

    // The facets are only shown on the Persons tab
    cy.get('.searchTab').eq(0).click();
    cy.get('.searchTab').eq(0).should('have.class', 'active');
    cy.get('.searchConditionsField').should('not.exist');
  });

  it('Filter with condition facets', function () {
    cy.visit('/search?group_select=5');
    cy.get('.tileItem.personResultItem').should('have.length', 3);

    // Filter by a condition
    cy.contains('.searchConditionsValue', 'Building A')
      .find('.searchConditionsCheckbox .checkbox')
      .click();
    cy.get('.tileItem.personResultItem').should('have.length', 2);
    cy.get('.tileItem .tileHeadline').contains('Ayla Demir');
    cy.get('.tileItem .tileHeadline').contains('Bob Miller');

    // Conditions on different fields are combined with AND
    cy.contains('.searchConditionsField', 'Room')
      .contains('.searchConditionsValue', '102')
      .find('.searchConditionsCheckbox .checkbox')
      .click();
    cy.get('.tileItem.personResultItem').should('have.length', 1);
    cy.get('.tileItem .tileHeadline').contains('Bob Miller');

    // Unchecking a condition restores the previous results
    cy.contains('.searchConditionsField', 'Room')
      .contains('.searchConditionsValue', '102')
      .find('.searchConditionsCheckbox .checkbox')
      .click();
    cy.get('.tileItem.personResultItem').should('have.length', 2);

    // Conditions on the same field are combined with OR
    cy.contains('.searchConditionsValue', 'Building B')
      .find('.searchConditionsCheckbox .checkbox')
      .click();
    cy.get('.tileItem.personResultItem').should('have.length', 3);
  });

  it('Filter with a vocabulary based condition facet', function () {
    cy.visit('/search?group_select=5');
    cy.get('.tileItem.personResultItem').should('have.length', 3);

    cy.contains('.searchConditionsValue', 'Bonn')
      .find('.searchConditionsCheckbox .checkbox')
      .click();
    cy.get('.tileItem.personResultItem').should('have.length', 2);
    cy.get('.tileItem .tileHeadline').contains('Ayla Demir');
    cy.get('.tileItem .tileHeadline').contains('Carla Schmidt');
  });

  it('Facet conditions are preserved in the URL', function () {
    cy.visit('/search?group_select=5');
    cy.get('.tileItem.personResultItem').should('have.length', 3);

    cy.contains('.searchConditionsValue', 'Building A')
      .find('.searchConditionsCheckbox .checkbox')
      .click();
    cy.get('.tileItem.personResultItem').should('have.length', 2);
    cy.url().should('include', 'facet_conditions=');

    // Reloading the page restores the tab and the conditions
    cy.reload();
    cy.get('.searchTab').eq(5).should('have.class', 'active');
    cy.get('.tileItem.personResultItem').should('have.length', 2);
    cy.contains('.searchConditionsValue', 'Building A')
      .find('input[type="checkbox"]')
      .should('be.checked');
  });

  it('Show more facet values', function () {
    // Create persons so that the Room facet has more than 5 values
    createPerson({
      id: 'dora-ellis',
      firstName: 'Dora',
      lastName: 'Ellis',
      building: 'Building C',
      room: '201',
    });
    createPerson({
      id: 'emil-fischer',
      firstName: 'Emil',
      lastName: 'Fischer',
      building: 'Building C',
      room: '202',
    });
    createPerson({
      id: 'greta-huber',
      firstName: 'Greta',
      lastName: 'Huber',
      building: 'Building C',
      room: '301',
    });
    createPerson({
      id: 'ivan-jonas',
      firstName: 'Ivan',
      lastName: 'Jonas',
      building: 'Building C',
      room: '302',
    });

    cy.visit('/search?group_select=5');
    cy.get('.tileItem.personResultItem').should('have.length', 7);

    // Only the first 5 values are shown
    cy.contains('.searchConditionsField', 'Room')
      .find('.searchConditionsValue')
      .should('have.length', 5);
    cy.contains('.searchConditionsField', 'Room')
      .find('.showMoreIndicator')
      .contains('Show more');

    // Show all values
    cy.contains('.searchConditionsField', 'Room')
      .find('.showMoreIndicator')
      .click();
    cy.contains('.searchConditionsField', 'Room')
      .find('.searchConditionsValue')
      .should('have.length', 6);
    cy.contains('.searchConditionsField', 'Room')
      .find('.searchConditionsValue')
      .contains('302');

    // Show less values again
    cy.contains('.searchConditionsField', 'Room')
      .find('.showMoreIndicator')
      .contains('Show less');
    cy.contains('.searchConditionsField', 'Room')
      .find('.showMoreIndicator')
      .click();
    cy.contains('.searchConditionsField', 'Room')
      .find('.searchConditionsValue')
      .should('have.length', 5);
  });

  it('Search in the facet values', function () {
    cy.visit('/search?group_select=5');
    cy.get('.tileItem.personResultItem').should('have.length', 3);

    // Non-vocabulary fields offer a text filter for their values
    cy.contains('.searchConditionsField', 'Building')
      .find('.searchConditionsFieldSearch input')
      .type('a');
    cy.contains('.searchConditionsField', 'Building').within(() => {
      cy.get('.searchConditionsValue').should('have.length', 1);
      cy.get('.searchConditionsValue').contains('Building A');
    });

    // Vocabulary based fields do not offer the text filter
    cy.contains('.searchConditionsField', 'Location')
      .find('.searchConditionsFieldSearch')
      .should('not.exist');
  });
});
