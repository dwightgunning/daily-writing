# See also: app.json 'formation' and heroku config 'WEB_CONCURRENCY'
# Use of Gunicorn's --pythonpath arg to allow it to locate ./backend/dailywriting/wsgi.py
web: newrelic-admin run-program gunicorn --log-file=- --worker-class gevent --pythonpath backend dailywriting.wsgi
