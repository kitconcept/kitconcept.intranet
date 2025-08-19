import { useSelector } from 'react-redux';
import Card from '@kitconcept/volto-light-theme/primitives/Card/Card';
import DefaultSummary from '@kitconcept/volto-light-theme/components/Summary/DefaultSummary';
import cx from 'classnames';

type IntlType = {
  intl: {
    locale: string;
  };
};

const EventItem = ({
  item,
  lang,
  isEditMode,
}: {
  item: any;
  lang: string;
  isEditMode: boolean;
}) => {
  const formatter = new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'short',
  });
  const headFormatter = new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    year: 'numeric',
    month: 'long',
  });

  const itemDates = (item: any) => {
    const start =
      item['@type'] === 'Event'
        ? item.start
          ? new Date(item.start)
          : null
        : item.Effective
          ? new Date(item.Effective)
          : new Date(item.CreationDate);

    const end =
      item['@type'] === 'Event' && (item.end ? new Date(item.end) : null);
      
    const notSameDay = end && start?.getDate() !== end?.getDate();
    const formattedStartDate = start ? formatter.format(start) : '';
    const formattedEndDate = end ? formatter.format(end) : '';
    const formattedHeaderDate = !end
      ? start
        ? headFormatter.format(start)
        : ''
      : start && end
        ? headFormatter.formatRange(start, end)
        : '';

    return {
      start,
      end,
      formattedStartDate,
      formattedEndDate,
      formattedHeaderDate,
      notSameDay,
    };
  };

  const {
    start,
    end,
    formattedHeaderDate,
    notSameDay,
    formattedStartDate,
    formattedEndDate,
  } = itemDates(item);

  return (
    <div className="card-listing">
      <Card href={isEditMode ? '' : item['@id']} className="event-card">
        <Card.Image>
          <div className={cx('date-inset', { 'has-end-date': notSameDay })}>
            <div className="day">
              {start && String(start?.getDate()).padStart(2, '0')}
            </div>
            <div className="month">{formattedStartDate}</div>
            {notSameDay && (
              <>
                <div className="separator"></div>
                <div className="day">
                  {end && String(end?.getDate()).padStart(2, '0')}
                </div>
                <div className="month">{formattedEndDate}</div>
              </>
            )}
          </div>
        </Card.Image>
        <Card.Summary>
          <div className="headline calendar">
            <span className="day">{formattedHeaderDate}</span>
            {item.head_title && (
              <span className="event-title">{item.head_title}</span>
            )}
          </div>
          <DefaultSummary item={item} HeadingTag="h2" />
        </Card.Summary>
      </Card>
    </div>
  );
};

const EventCalendarTemplate = (props: any) => {
  const lang = useSelector((state: IntlType) => state.intl.locale);
  return (
    <div className="event-calendar items">
      {props.items.map((item: any, index: number) => (
        <EventItem
          key={index}
          item={item}
          lang={lang}
          isEditMode={props.isEditMode}
        />
      ))}
    </div>
  );
};

export default EventCalendarTemplate;
