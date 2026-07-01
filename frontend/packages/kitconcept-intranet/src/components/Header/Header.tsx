import HeaderSearch from './HeaderSearch';

const Header = () => {
  return (
    <div className="header-intranet-compact-wrapper">
      <div className="header-intranet-compact">
        <HeaderSearch />
      </div>
      <div className="pusher" />
    </div>
  );
};

export default Header;
