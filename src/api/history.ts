import axios from 'axios';
import { StoryData } from '../types/history';
import { MyPageResponse } from '../types/history';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const fetchMyPageData = async (): Promise<MyPageResponse> => {
  const response = await api.get('/accounts/api/history/');
  return response.data;
};

const BASE_URL = 'http://127.0.0.1:8000/api/stories/';

export const fetchStationStory = async (stationId: number): Promise<StoryData> => {
  const response = await axios.get(`http://127.0.0.1:8000/api/stories/station/${stationId}/`);
  return response.data;
};