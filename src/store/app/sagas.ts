import { takeEvery, all, fork, put, call } from 'redux-saga/effects'
import request from '../../utils/request'
import { appTypes } from './types'
import { routerHistory } from '../../utils/history'
import {
  userLoginSuccess,
  refreshTokenUpdated,
  fetchProfileSuccess,
  fetchTasksSuccess,
} from './actions'

function* registrationWatcher() {
  yield takeEvery(appTypes.USER_REGISTRATION_START, registrationWorker)
}

function* registrationWorker({ payload }: any) {
  try {
    const response = yield call(registration, payload)
    routerHistory.push('/login')
    if (response instanceof Error) {
      // TODO: отправить ошибку в стор
    }
  } catch (e) {
    console.log(e)
  }
}

// TODO: types
async function registration(data: any) {
  const { name, email, password } = data
  try {
    const response = await request({
      url: 'https://time-management-sfedu.herokuapp.com/users/registration',
      method: 'POST',
      data: {
        username: name,
        email: email,
        password: password,
      },
    })
    return response
  } catch (e) {
    return new Error('Что-то пошло не так')
  }
}

function* loginWatcher() {
  yield takeEvery(appTypes.USER_LOGIN_START, loginWorker)
}

function* loginWorker({ payload }: any) {
  const response = yield call(login, payload)
  localStorage.setItem('uid', response.data.uid)
  yield setInLocalStorage(response)
  yield put(userLoginSuccess(response.data))
}

async function login(data: any) {
  const { email, password } = data
  try {
    const response = await request({
      url: 'https://time-management-sfedu.herokuapp.com/users/login',
      method: 'POST',
      data: {
        password,
        email,
      },
    })
    return response
  } catch (e) {
    return new Error('Что-то пошло не так')
  }
}

function* setInLocalStorage({ data }: any) {
  yield localStorage.setItem('ACCESS_TOKEN', data.access_token)
  yield localStorage.setItem('REFRESH_TOKEN', data.refresh_token)
}

function* refreshTokenWatcher() {
  yield takeEvery(appTypes.REFRESH_TOKEN_START, refreshTokenWorker)
}

function* refreshTokenWorker({ payload }: any) {
  const response = yield call(refreshTokenQuery, payload)
  yield setInLocalStorage(response)
  yield put(refreshTokenUpdated(response.data))
}

async function refreshTokenQuery(data: any) {
  const response = await request({
    url: 'https://time-management-sfedu.herokuapp.com/users/token/refresh',
    method: 'POST',
    data: {
      refresh_token: data.REFRESH_TOKEN,
    },
  })

  return response
}

function* fetchProfileWatcher() {
  yield takeEvery(appTypes.FETCH_PROFILE_START, fetchProfileWorker)
}

function* fetchProfileWorker({ payload }: any) {
  const response = yield call(fetchProfile, payload)
  yield put(fetchProfileSuccess(response.data))
}

async function fetchProfile(data: any) {
  const response = await request({
    url: 'https://time-management-sfedu.herokuapp.com/users/profile',
    params: {
      id: data,
    },
  })
  return response
}

function* fetchTasksWatcher() {
  yield takeEvery(appTypes.FETCH_TASKS_START, fetchTasksWorker)
}

function* fetchTasksWorker({ payload }: any) {
  const response = yield call(fetchTasks, payload)
  yield put(fetchTasksSuccess(response.data))
}

async function fetchTasks(data: any) {
  const response = await request({
    url: 'https://time-management-sfedu.herokuapp.com/tasks',
    params: {
      uid: data,
    },
  })
  return response
}

export default function* app() {
  yield all([
    fork(registrationWatcher),
    fork(loginWatcher),
    fork(refreshTokenWatcher),
    fork(fetchProfileWatcher),
    fork(fetchTasksWatcher),
  ])
}
