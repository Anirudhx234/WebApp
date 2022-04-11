import withStyles from '@mui/styles/withStyles';
import PropTypes from 'prop-types';
import React, { Component, Suspense } from 'react';
import Helmet from 'react-helmet';
import styled from 'styled-components';
import ActivityActions from '../actions/ActivityActions';
import AnalyticsActions from '../actions/AnalyticsActions';
import ReadyActions from '../actions/ReadyActions';
import apiCalming from '../common/utils/apiCalming';
import { isAndroid, isIOS } from '../common/utils/cordovaUtils';
import historyPush from '../common/utils/historyPush';
import { isWebApp } from '../common/utils/isCordovaOrWebApp';
import { renderLog } from '../common/utils/logging';
import ReadyInformationDisclaimer from '../components/Ready/ReadyInformationDisclaimer';
import ReadyTaskBallot from '../components/Ready/ReadyTaskBallot';
import ReadyTaskFriends from '../components/Ready/ReadyTaskFriends';
import ReadyTaskPlan from '../components/Ready/ReadyTaskPlan';
import ReadyTaskRegister from '../components/Ready/ReadyTaskRegister';
import { PageContentContainer } from '../components/Style/pageLayoutStyles';
import BrowserPushMessage from '../components/Widgets/BrowserPushMessage';
import webAppConfig from '../config';
import AppObservableStore from '../stores/AppObservableStore';
import VoterStore from '../stores/VoterStore';
import lazyPreloadPages from '../utils/lazyPreloadPages';

const ElectionCountdown = React.lazy(() => import(/* webpackChunkName: 'ElectionCountdown' */ '../components/Ready/ElectionCountdown'));
const FirstAndLastNameRequiredAlert = React.lazy(() => import(/* webpackChunkName: 'FirstAndLastNameRequiredAlert' */ '../components/Widgets/FirstAndLastNameRequiredAlert'));
const ReadMore = React.lazy(() => import(/* webpackChunkName: 'ReadMore' */ '../common/components/Widgets/ReadMore'));

const nextReleaseFeaturesEnabled = webAppConfig.ENABLE_NEXT_RELEASE_FEATURES === undefined ? false : webAppConfig.ENABLE_NEXT_RELEASE_FEATURES;
const futureFeaturesDisabled = true;

class ReadyLight extends Component {
  constructor (props) {
    super(props);
    this.state = {
      chosenReadyIntroductionText: '',
      chosenReadyIntroductionTitle: '',
      voterIsSignedIn: false,
    };
  }

  componentDidMount () {
    ReadyActions.voterPlansForVoterRetrieve();
    if (apiCalming('activityNoticeListRetrieve', 10000)) {
      ActivityActions.activityNoticeListRetrieve();
    }
    AppObservableStore.setEvaluateHeaderDisplay();

    this.analyticsTimer = setTimeout(() => {
      AnalyticsActions.saveActionReadyVisit(VoterStore.electionId());
    }, 8000);

    this.preloadTimer = setTimeout(() => lazyPreloadPages(), 3000);

    this.setState({
      chosenReadyIntroductionText: AppObservableStore.getChosenReadyIntroductionText(),
      chosenReadyIntroductionTitle: AppObservableStore.getChosenReadyIntroductionTitle(),
    });
  }

  componentDidCatch (error, info) {
    console.log('ReadyLight.jsx caught: ', error, info.componentStack);
  }

  componentWillUnmount () {
    clearTimeout(this.analyticsTimer);
    clearTimeout(this.preloadTimer);

    const { showReadyHeavy } = this.props;
    showReadyHeavy();
  }

  static getDerivedStateFromError (error) {       // eslint-disable-line no-unused-vars
    console.log('Error in ReadyLight: ', error);
    return { hasError: true };
  }

  goToBallot = () => {
    console.log('goToBallot ENTRY from ready light');
    historyPush('/ballot');
  }

  getTopPadding = () => {
    if (isWebApp()) {
      return { paddingTop: '0 !important' };
    } else if (isIOS()) {
      // TODO: This is a bad place to set a top padding: Move it to Application__Wrapper on the next iOS pass
      return { paddingTop: '56px !important' };  // SE2: 56px, 11 Pro Max: 56px
    } else if (isAndroid()) {
      return { paddingTop: 'unset' };
    }
    return {};
  }

  render () {
    renderLog('ReadyLight');  // Set LOG_RENDER_EVENTS to log all renders
    const {
      chosenReadyIntroductionText, chosenReadyIntroductionTitle, voterIsSignedIn,
    } = this.state;

    return (
      <PageContentContainer>
        <PageContainer className="container-fluid" style={this.getTopPadding()}>
          <Helmet title="Ready to Vote? - We Vote" />
          <BrowserPushMessage incomingProps={this.props} />
          <div className="row">
            <Suspense fallback={<SuspenseCard>&nbsp;</SuspenseCard>}>
              <ElectionCountdownOuterWrapper className="col-12">
                <ElectionCountdownInnerWrapper>
                  <Suspense fallback={<SuspenseCard>&nbsp;</SuspenseCard>}>
                    <ElectionCountdown onClickFunction={this.goToBallot} initialDelay={4000} />
                  </Suspense>
                </ElectionCountdownInnerWrapper>
              </ElectionCountdownOuterWrapper>
            </Suspense>

            <div className="col-sm-12 col-lg-8">
              {(chosenReadyIntroductionTitle || chosenReadyIntroductionText) && (
                <Card className="card u-show-mobile-tablet">
                  <div className="card-main">
                    <Title>
                      {chosenReadyIntroductionTitle}
                    </Title>
                    <Paragraph>
                      <Suspense fallback={<></>}>
                        <ReadMore
                          textToDisplay={chosenReadyIntroductionText}
                          numberOfLines={3}
                        />
                      </Suspense>
                    </Paragraph>
                  </div>
                </Card>
              )}
              <ReadyInformationDisclaimer top />
              <ReadyTaskBallot
                arrowsOn
              />
              <IntroAndFindTabletWrapper className="u-show-tablet">
                <IntroAndFindTabletSpacer />
              </IntroAndFindTabletWrapper>
              {(nextReleaseFeaturesEnabled && !futureFeaturesDisabled) && (
                <ReadyTaskRegister
                  arrowsOn
                />
              )}
              <ReadyInformationDisclaimer bottom />
              {voterIsSignedIn && (
                <Suspense fallback={<></>}>
                  <FirstAndLastNameRequiredAlert />
                </Suspense>
              )}
              {nextReleaseFeaturesEnabled && (
                <ReadyTaskFriends
                  arrowsOn
                />
              )}
              <ReadyTaskPlan
                arrowsOn
              />
            </div>
            <div className="col-lg-4 d-none d-lg-block">
              {(chosenReadyIntroductionTitle || chosenReadyIntroductionText) && (
                <Card className="card">
                  <div className="card-main">
                    <Title>
                      {chosenReadyIntroductionTitle}
                    </Title>
                    <Paragraph>
                      {chosenReadyIntroductionText}
                    </Paragraph>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </PageContainer>
      </PageContentContainer>
    );
  }
}
ReadyLight.propTypes = {
  // match: PropTypes.object,
  showReadyHeavy: PropTypes.func,
};

const styles = (theme) => ({
  ballotIconRoot: {
    width: 150,
    height: 150,
    color: 'rgb(171, 177, 191)',
  },
  ballotButtonIconRoot: {
    marginRight: 8,
  },
  ballotButtonRoot: {
    width: 250,
    [theme.breakpoints.down('md')]: {
      width: '100%',
    },
  },
});

const Card = styled('div')`
  padding-bottom: 4px;
`;

const ElectionCountdownInnerWrapper = styled('div')`
  margin-top: -37px; // 29px for height of ShareButtonDesktopTablet - 8px for margin-top
`;

const ElectionCountdownOuterWrapper = styled('div')`
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
`;

const IntroAndFindTabletWrapper = styled('div')`
  display: flex;
  justify-content: center;
`;

const IntroAndFindTabletSpacer = styled('div')`
  width: 20px;
`;

const PageContainer = styled('div')`
// This is a bad place to set a top padding for the scrollable pane, it should be in Application__Wrapper
`;

const Paragraph = styled('div')`
`;

const SuspenseCard = styled('div')`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 290px;
  height: 138px;
`;

const Title = styled('h2')(({ theme }) => (`
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 12px;
  ${theme.breakpoints.down('sm')} {
    font-size: 14px;
    margin: 0 0 4px;
  }
`));

export default withStyles(styles)(ReadyLight);