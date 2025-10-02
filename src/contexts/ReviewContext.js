import React, {
  createContext,
  useReducer,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import ratingService from '../services/ratingService';

export const REVIEW_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  MAINTENANCE: 'maintenance',
  ERROR: 'error',
};

const initialState = {
  items: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  status: REVIEW_STATUS.IDLE,
  error: null,
  lastUpdatedAt: null,
  cached: [],
};

const ACTIONS = {
  REQUEST: 'REQUEST',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RESTORE: 'RESTORE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

const reviewReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.REQUEST:
      return {
        ...state,
        status: REVIEW_STATUS.LOADING,
        error: null,
      };

    case ACTIONS.SUCCESS:
      return {
        ...state,
        items: action.payload.items,
        pagination: action.payload.pagination,
        cached: action.payload.items,
        status: REVIEW_STATUS.READY,
        error: null,
        lastUpdatedAt: Date.now(),
      };

    case ACTIONS.RESTORE:
      return {
        ...state,
        items: state.cached,
        status: REVIEW_STATUS.MAINTENANCE,
        error: action.payload,
      };

    case ACTIONS.FAILURE:
      return {
        ...state,
        items: [],
        status: action.payload.status || REVIEW_STATUS.ERROR,
        error: action.payload.error,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        status: state.items.length > 0 ? REVIEW_STATUS.READY : REVIEW_STATUS.IDLE,
      };

    default:
      return state;
  }
};

const ReviewContext = createContext(null);

export const ReviewProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reviewReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchReviews = useCallback(
    async ({ userId, role = 'caregiver', page = 1, limit = 10 } = {}) => {
      if (!userId) {
        dispatch({ type: ACTIONS.FAILURE, payload: { error: 'Missing userId', status: REVIEW_STATUS.ERROR } });
        return null;
      }

      dispatch({ type: ACTIONS.REQUEST });

      try {
        const result =
          role === 'caregiver'
            ? await ratingService.getCaregiverRatings(userId, page, limit)
            : await ratingService.getParentRatings(userId, page, limit);

        dispatch({ type: ACTIONS.SUCCESS, payload: result });
        return result;
      } catch (error) {
        const statusType = error?.statusType;
        const payload = {
          error: error?.message || 'Failed to load reviews',
          status: statusType === 'maintenance' ? REVIEW_STATUS.MAINTENANCE : REVIEW_STATUS.ERROR,
        };

        const cachedSnapshot = stateRef.current.cached;

        if (payload.status === REVIEW_STATUS.MAINTENANCE && cachedSnapshot.length > 0) {
          dispatch({ type: ACTIONS.RESTORE, payload: payload.error });
        } else {
          dispatch({ type: ACTIONS.FAILURE, payload });
        }

        return null;
      }
    },
    []
  );

  const clearError = useCallback(() => dispatch({ type: ACTIONS.CLEAR_ERROR }), []);

  const value = useMemo(
    () => ({
      reviews: state.items,
      pagination: state.pagination,
      status: state.status,
      error: state.error,
      lastUpdatedAt: state.lastUpdatedAt,
      cached: state.cached,
      fetchReviews,
      clearError,
    }),
    [state, fetchReviews, clearError]
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
};

export const useReview = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};
