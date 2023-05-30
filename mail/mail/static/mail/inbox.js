document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  // document.querySelector('#compose-form').addEventListener('submit', submit_email);
  document.querySelector('#compose-form').onsubmit = submit_email

  // By default, load the inbox
  load_mailbox('inbox');
});


function submit_email(){
  let recipients = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify ({
    recipients: recipients,
    subject: subject,
    body: body
    })
    })
    .then(response => response.json())
    .then(result => {

        if(result.error){
          document.querySelector('.alert-danger').style.display = 'block';
          document.querySelector('.alert-danger').innerHTML = result.error;
          return false;
        }

        load_mailbox('sent');
    })
    .catch((error) => 
        alert(error)
    );
    return false;
}
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('.alert-danger').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    console.log(emails);
    var table , tbody , tr , td;
    table = document.createElement("table");
    table.setAttribute("class", "table table-inbox table-hover");
    table.style.border = "1px solid #d3d3d3";
    table.style.marginBottom = "0";
    table.style.fontWeight = "600";
    tbody = document.createElement("tbody");

    emails.forEach(function(email) {

      tr = document.createElement("tr");

      var mailList = [ email.sender ,email.subject ,email.timestamp ]
      for (var i = 0; i < mailList.length; i++) {
        td = document.createElement("td");
        td.innerHTML = mailList[i];
        tr.appendChild(td);
      }
     
      tbody.appendChild(tr);

      if (email.read)
      {
        tr.style.backgroundColor = "#ebebeb";
      }
      else
      {
        tr.style.backgroundColor = "white";
      }

      tr.addEventListener('click', function() {
        get_email(email.id,mailbox);
        if (!email.read)
        {
          update_email(email.id)
        }
      });
     
  });
  
    table.appendChild(tbody);
    document.querySelector('#emails-view').append(table);

  });
}

function get_email(id,mailbox) {

  document.querySelector('#email-view').innerHTML = '' ;
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  let emailView = document.querySelector('#email-view');
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    console.log(email);

    const mailDictionary = {From :  email.sender , To :  email.recipients , Subject :  email.subject ,Timestamp :  email.timestamp }
    var div , span1 , span2;
    for (let key in mailDictionary) {
      div = document.createElement("div");
      span1 = document.createElement("span");
      span1.setAttribute("class", "font-weight-bold");
      span1.textContent =`${key}: `;
      span2 = document.createElement("span");
      span2.textContent = mailDictionary[key];
      div.appendChild(span1)
      div.appendChild(span2)
      document.querySelector('#email-view').append(div);
    }

  
    if(mailbox !== "sent")
    {
      var buttonReply = document.createElement("button");
      buttonReply.setAttribute("class", "btn btn-sm btn-outline-primary mt-2");
      buttonReply.textContent = "Reply";
      emailView.append(buttonReply);
      buttonReply.addEventListener('click', function() {
        reply_email(email);
      });
    }
    var hr = document.createElement("hr");
    var p = document.createElement("p");
    p.textContent = email.body;
    emailView.append(hr)
    emailView.append(p)
    if(mailbox !== "sent")
    {
      var buttonArchive = document.createElement("button");
      buttonArchive.setAttribute("class", "btn btn-sm btn-outline-warning mt-2");
      if(!email.archived){
        buttonArchive.textContent = "Archive ";
      }
      else{
        buttonArchive.textContent = "Unarchive ";
      }
      emailView.append(buttonArchive);
      buttonArchive.addEventListener('click', function() {
          archive_email(id,email.archived);
      });
    }

  });
}


function update_email(id)
{
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function archive_email(id,archived)
{
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived
    })
  }).then(result => {load_mailbox('inbox');});
}

function reply_email(email)
{
  compose_email();
  document.querySelector('#compose-recipients').value = email.sender;
  //checking If the subject line already begins with Re:
  if (email.subject.includes('Re:')) {
    document.querySelector('#compose-subject').value = email.subject;
  }
  else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }

  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
}

