/**
 * PersonView view component.
 * @module components/theme/View/PersonView
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import config from '@plone/volto/registry';
import phoneSVG from '@plone/volto/icons/mobile.svg';
import mailSVG from '@plone/volto/icons/email.svg';
import worldSVG from '@plone/volto/icons/world.svg';
import Icon from '@plone/volto/components/theme/Icon/Icon';

interface PersonViewProps {
  content: {
    first_name: string;
    last_name?: string;
    description?: string;
    image?: {
      scales?: {
        preview?: {
          download: string;
        };
      };
      download?: string;
    };
    academic_title?: {
      title: string;
    };
    organisational_unit_reference?: {
      title: string;
    };
    department?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    contact_website?: string;
    contact_building?: string;
    contact_room?: string;
    location_reference?: {
      title: string;
    };
  };
}

/**
 * PersonView view component class.
 * @function PersonView
 * @params {object} content Content object.
 * @returns {string} Markup of the component.
 */
const PersonView: React.FC<PersonViewProps> = ({ content }) => {
  const Container = config.getComponent({ name: 'Container' }).component;
  console.log(content);

  const profile = {
    imageUrl:
      content.image?.scales?.preview?.download ?? content.image?.download,
    fullName: content.academic_title?.title
      ? content.last_name
        ? `${content.academic_title.title} ${content.first_name} ${content.last_name}`
        : `${content.academic_title.title} ${content.first_name}`
      : content.first_name,
    department: content.department ?? null,
    organisationalUnit: content.organisational_unit_reference?.title ?? null,
  };

  const contact = {
    officePhone: content.contact_phone ?? null,
    mobilePhone: null,
    fax: null,
    email: content.contact_email ?? null,
    website: content.contact_website ?? null,
    contactBuilding: content.contact_building ?? null,
    contactRoom: content.contact_room ?? null,
  };

  return (
    <Container id="page-document" className="view-wrapper person-view">
      <div className="person-profile">
        <header className="profile-header">
          {profile.imageUrl && (
            <img
              src={profile.imageUrl}
              alt={profile.fullName}
              className="profile-image"
              loading="lazy"
            />
          )}
          <div className="profile-info">
            <span className="organisational-unit">
              {profile.organisationalUnit}
            </span>
            <h1>{profile.fullName}</h1>
            <div className="affiliations">
              {profile.department && <span>{profile.department}</span>}
            </div>
          </div>
        </header>

        {(contact.officePhone ||
          contact.mobilePhone ||
          contact.fax ||
          contact.email ||
          contact.website) && (
          <div className="contact-wrapper">
            <section aria-labelledby="contact-heading">
              <h2 id="contact-heading">
                <FormattedMessage id="Contact" defaultMessage="Contact" />
              </h2>
              <div className="contact-list">
                {contact.officePhone && (
                  <div className="contact-item">
                    <Icon
                      title={
                        <FormattedMessage id="Phone" defaultMessage="Phone" />
                      }
                      name={phoneSVG}
                      size="36px"
                    />
                    <a
                      href={`tel:${contact.officePhone}`}
                      aria-label="Office phone"
                    >
                      {contact.officePhone}
                    </a>
                  </div>
                )}

                {contact.mobilePhone && (
                  <div className="contact-item">
                    <span aria-label="Mobile phone">{contact.mobilePhone}</span>
                  </div>
                )}

                {contact.fax && (
                  <div className="contact-item">
                    <span aria-label="Fax">{contact.fax}</span>
                  </div>
                )}

                {contact.email && (
                  <div className="contact-item">
                    <Icon
                      title={
                        <FormattedMessage id="E-mail" defaultMessage="E-mail" />
                      }
                      name={mailSVG}
                      size="36px"
                    />
                    <a href={`mailto:${contact.email}`} aria-label="Email">
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.website && (
                  <div className="contact-item">
                    <Icon
                      title={
                        <FormattedMessage id="Site" defaultMessage="Site" />
                      }
                      name={worldSVG}
                      size="36px"
                    />
                    <a href={contact.website} aria-label="Website">
                      {contact.website}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {content?.location_reference && (
              <section aria-labelledby="address-heading">
                <h2 id="address-heading">
                  <FormattedMessage id="Address" defaultMessage="Address" />
                </h2>
                <address>
                  <h3>{content.location_reference.title}</h3>
                  {profile.department && <p>{profile.department}</p>}

                  <div className="building-room">
                    {contact.contactBuilding && (
                      <div>
                        <FormattedMessage
                          id="Building"
                          defaultMessage="Building"
                        />{' '}
                        {contact.contactBuilding}
                        {contact.contactRoom && (
                          <span>
                            {' '}
                            /{' '}
                            <FormattedMessage
                              id="Room"
                              defaultMessage="Room"
                            />{' '}
                            {contact.contactRoom}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </address>
              </section>
            )}
          </div>
        )}

        {content.description && (
          <section className="bio-section" aria-labelledby="bio-heading">
            <h2 id="bio-heading">
              <FormattedMessage id="Bio" defaultMessage="Bio" />
            </h2>
            <div className="bio-content">
              <p>{content.description}</p>
            </div>
            <svg
              viewBox="0 0 948 63"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.582031 1H117.744V60.9434L177.688 1H947.416"
                stroke="black"
              />
            </svg>
          </section>
        )}
      </div>
    </Container>
  );
};

export default PersonView;
